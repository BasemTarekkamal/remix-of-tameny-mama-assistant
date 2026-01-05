
import React from 'react';
import Header from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Circle, Baby } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const VACCINATION_SCHEDULE = [
  {
    age: 'عند الولادة',
    vaccines: [
      { name: 'التهاب الكبد B', completed: true },
      { name: 'BCG (السل)', completed: true },
      { name: 'شلل الأطفال', completed: true },
    ]
  },
  {
    age: 'شهرين',
    vaccines: [
      { name: 'خماسي (DTP + Hib + التهاب الكبد B)', completed: false },
      { name: 'شلل الأطفال', completed: false },
      { name: 'المكورات الرئوية PCV13', completed: false },
      { name: 'الروتا', completed: false },
    ]
  },
  {
    age: '4 أشهر',
    vaccines: [
      { name: 'خماسي (DTP + Hib + التهاب الكبد B)', completed: false },
      { name: 'شلل الأطفال', completed: false },
      { name: 'المكورات الرئوية PCV13', completed: false },
      { name: 'الروتا', completed: false },
    ]
  },
  {
    age: '6 أشهر',
    vaccines: [
      { name: 'خماسي (DTP + Hib + التهاب الكبد B)', completed: false },
      { name: 'شلل الأطفال', completed: false },
      { name: 'المكورات الرئوية PCV13', completed: false },
      { name: 'الروتا', completed: false },
    ]
  },
  {
    age: '9 أشهر',
    vaccines: [
      { name: 'الحصبة، النكاف، الحصبة الألمانية (MMR)', completed: false },
    ]
  },
  {
    age: '12 شهر',
    vaccines: [
      { name: 'الحصبة، النكاف، الحصبة الألمانية (MMR)', completed: false },
      { name: 'جدري الماء', completed: false },
    ]
  },
  {
    age: '18 شهر',
    vaccines: [
      { name: 'خماسي (DTP + Hib + التهاب الكبد B)', completed: false },
      { name: 'شلل الأطفال', completed: false },
    ]
  }
];

const MILESTONES = [
  {
    age: '0-3 أشهر',
    physical: [
      { description: 'يرفع رأسه ورقبته عند وضعه على بطنه', achieved: true },
      { description: 'يتابع الأشياء المتحركة بعينيه', achieved: true },
      { description: 'يفتح ويغلق يديه', achieved: true },
    ],
    social: [
      { description: 'يبتسم استجابة للابتسامة', achieved: true },
      { description: 'يهدأ عند سماع صوت مألوف', achieved: true },
      { description: 'يبدأ بإصدار أصوات غير البكاء', achieved: true },
    ]
  },
  {
    age: '4-6 أشهر',
    physical: [
      { description: 'يتدحرج من الظهر إلى البطن والعكس', achieved: false },
      { description: 'يجلس بمساعدة', achieved: false },
      { description: 'يبدأ في الإمساك بالأشياء', achieved: false },
    ],
    social: [
      { description: 'يضحك بصوت عالٍ', achieved: false },
      { description: 'يظهر اهتماماً بالألعاب', achieved: false },
      { description: 'يتعرف على الوجوه المألوفة', achieved: false },
    ]
  },
  {
    age: '7-9 أشهر',
    physical: [
      { description: 'يجلس دون دعم', achieved: false },
      { description: 'يبدأ في الحبو', achieved: false },
      { description: 'يقف بمساعدة', achieved: false },
    ],
    social: [
      { description: 'يستجيب لاسمه', achieved: false },
      { description: 'يقلد أصواتاً وحركات بسيطة', achieved: false },
      { description: 'يظهر قلقاً من الغرباء', achieved: false },
    ]
  },
  {
    age: '10-12 شهر',
    physical: [
      { description: 'يقف لوحده لفترة قصيرة', achieved: false },
      { description: 'يمشي بمساعدة أو بالتشبث بالأثاث', achieved: false },
      { description: 'يلتقط أشياء صغيرة بإبهامه وسبابته', achieved: false },
    ],
    social: [
      { description: 'يقول كلمة أو كلمتين مثل "ماما" أو "بابا"', achieved: false },
      { description: 'يشير للأشياء التي يريدها', achieved: false },
      { description: 'يلعب ألعاباً بسيطة مثل "بيبو"', achieved: false },
    ]
  }
];

const GrowthPage = () => {
  const { user } = useAuth();
  const [children, setChildren] = React.useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = React.useState<string>('');
  const [completedVaccines, setCompletedVaccines] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (user) {
      fetchChildren();
    }
  }, [user]);

  React.useEffect(() => {
    if (selectedChildId) {
      fetchVaccinationStatus();
    }
  }, [selectedChildId]);

  const fetchChildren = async () => {
    const { data } = await supabase
      .from('children')
      .select('id, name')
      .eq('parent_id', user?.id)
      .order('name');

    if (data && data.length > 0) {
      setChildren(data);
      setSelectedChildId(data[0].id);
    }
    setLoading(false);
  };

  const fetchVaccinationStatus = async () => {
    const { data } = await supabase
      .from('child_vaccinations' as any)
      .select('vaccine_name')
      .eq('child_id', selectedChildId)
      .eq('completed', true);

    if (data) {
      setCompletedVaccines(data.map((v: any) => v.vaccine_name));
    } else {
      setCompletedVaccines([]);
    }
  };

  const toggleVaccine = async (vaccineName: string) => {
    if (!selectedChildId) return;

    const isCompleted = completedVaccines.includes(vaccineName);
    const newCompleted = isCompleted
      ? completedVaccines.filter(v => v !== vaccineName)
      : [...completedVaccines, vaccineName];

    setCompletedVaccines(newCompleted);

    try {
      if (isCompleted) {
        await supabase
          .from('child_vaccinations' as any)
          .delete()
          .eq('child_id', selectedChildId)
          .eq('vaccine_name', vaccineName);
      } else {
        await supabase
          .from('child_vaccinations' as any)
          .upsert({
            child_id: selectedChildId,
            vaccine_name: vaccineName,
            completed: true,
            completed_at: new Date().toISOString()
          } as any);
      }
      toast.success(isCompleted ? 'تم إلغاء التحديد' : 'تم تحديد التطعيم كمكتمل');
    } catch (err) {
      toast.error('حدث خطأ في حفظ البيانات');
      setCompletedVaccines(completedVaccines); // Rollback
    }
  };

  if (loading) {
    return <div className="p-8 text-center">جاري التحميل...</div>;
  }
  return (
    <div className="pb-24">
      <Header title="النمو والتطعيمات" showBack onBack={() => window.history.back()} />

      {children.length > 0 && (
        <div className="mb-6 px-1">
          <Label className="text-xs text-muted-foreground mb-2 block mr-1">اختر الطفل</Label>
          <Select value={selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger className="w-full rounded-2xl border-gray-100 bg-white shadow-sm h-12">
              <div className="flex items-center gap-2">
                <Baby size={18} className="text-primary" />
                <SelectValue placeholder="اختر الطفل" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
              {children.map(child => (
                <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Tabs defaultValue="milestones" className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-gray-50/50 p-1 rounded-2xl mb-6">
          <TabsTrigger value="milestones" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">مراحل النمو</TabsTrigger>
          <TabsTrigger value="vaccinations" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">جدول التطعيمات</TabsTrigger>
        </TabsList>

        <TabsContent value="milestones" className="mt-4 space-y-4">
          {MILESTONES.map((milestone, index) => (
            <Card key={index} className="p-4">
              <h3 className="font-bold text-lg mb-3 bg-tameny-light p-2 rounded-lg text-tameny-primary">
                {milestone.age}
              </h3>

              <div className="mb-4">
                <h4 className="font-medium mb-2">التطور الجسدي</h4>
                <ul className="space-y-2">
                  {milestone.physical.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      {item.achieved ? (
                        <CheckCircle2 className="text-green-500 mt-0.5" size={18} />
                      ) : (
                        <Circle className="text-gray-300 mt-0.5" size={18} />
                      )}
                      <span className={item.achieved ? 'text-gray-800' : 'text-gray-500'}>
                        {item.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">التطور الاجتماعي واللغوي</h4>
                <ul className="space-y-2">
                  {milestone.social.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      {item.achieved ? (
                        <CheckCircle2 className="text-green-500 mt-0.5" size={18} />
                      ) : (
                        <Circle className="text-gray-300 mt-0.5" size={18} />
                      )}
                      <span className={item.achieved ? 'text-gray-800' : 'text-gray-500'}>
                        {item.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="vaccinations" className="space-y-4">
          {!selectedChildId ? (
            <Card className="p-8 text-center rounded-3xl border-dashed border-2 border-gray-100">
              <p className="text-muted-foreground text-sm">يرجى إضافة طفل أولاً لتتبع التطعيمات</p>
            </Card>
          ) : (
            VACCINATION_SCHEDULE.map((schedule, index) => (
              <Card key={index} className="p-5 rounded-3xl border-none shadow-soft overflow-hidden relative">
                <div className="absolute top-0 right-0 w-1 pt-full bg-primary/10 h-full" />
                <h3 className="font-bold text-base mb-4 text-primary flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  {schedule.age}
                </h3>

                <ul className="space-y-3">
                  {schedule.vaccines.map((vaccine, idx) => {
                    const isCompleted = completedVaccines.includes(vaccine.name);
                    return (
                      <li
                        key={idx}
                        onClick={() => toggleVaccine(vaccine.name)}
                        className={`flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer ${isCompleted ? 'bg-green-50/50 text-green-700' : 'bg-gray-50/50 hover:bg-gray-100/50'
                          }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="text-green-500" size={20} />
                        ) : (
                          <Circle className="text-gray-300" size={20} />
                        )}
                        <span className="text-sm font-medium">
                          {vaccine.name}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GrowthPage;
