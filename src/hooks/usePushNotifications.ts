import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

export const usePushNotifications = () => {
    useEffect(() => {
        const isMobile = Capacitor.isNativePlatform();

        if (!isMobile) {
            console.log('Push notifications are only supported on mobile devices.');
            return;
        }

        const registerPushNotifications = async () => {
            try {
                let permStatus = await PushNotifications.checkPermissions();

                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive !== 'granted') {
                    console.log('Push notification permissions denied');
                    // Don't spam error toast on every load if denied
                    return;
                }

                await PushNotifications.register();
            } catch (error) {
                console.error('Error registering for push notifications:', error);
            }
        };

        // Listeners
        const addListeners = async () => {
            await PushNotifications.addListener('registration', async token => {
                console.log('Push registration success, token: ' + token.value);

                // Save token to Supabase profiles table
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { error } = await supabase
                        .from('profiles')
                        .update({ push_token: token.value })
                        .eq('id', user.id);

                    if (error) {
                        console.error('Error saving push token to profile:', error);
                    } else {
                        console.log('Push token saved to profile successfully');
                    }
                }
            });

            await PushNotifications.addListener('registrationError', err => {
                console.error('Push registration error: ', err.error);
            });

            await PushNotifications.addListener('pushNotificationReceived', notification => {
                console.log('Push notification received: ', notification);
                toast.info(notification.title || 'New Notification', {
                    description: notification.body,
                });
            });

            await PushNotifications.addListener('pushNotificationActionPerformed', notification => {
                console.log('Push notification action performed', notification.actionId, notification.inputValue);
            });
        };

        registerPushNotifications();
        addListeners();

        return () => {
            if (isMobile) {
                PushNotifications.removeAllListeners();
            }
        };
    }, []);

    return {};
};
