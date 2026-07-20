import { Shield, Award, Heart } from 'lucide-react';

export default function GuaranteeBanner() {
  const guarantees = [
    {
      icon: Shield,
      title: 'Yên Tâm Vệ Sinh',
      desc: 'Mọi dụng cụ kềm kéo, chậu ngâm đều được khử trùng sấy tia cực tím chu đáo nhất.',
    },
    {
      icon: Award,
      title: 'Tay Nghề Thành Thạo',
      desc: 'Kỹ thuật viên gội đầu và thợ làm móng được chứng nhận tay nghề cao, tỉ mỉ tận tâm.',
    },
    {
      icon: Heart,
      title: 'Dược Liệu Thiên Nhiên',
      desc: 'Min sử dụng 100% dầu gội thảo dược thảo mộc đun nấu thủ công chất lượng cao nhất.',
    },
  ];

  return (
    <section className="py-12 bg-white border-t border-b border-[#EADDCD] my-8">
      <div className="max-w-4xl xxl:max-w-5xl 4k:max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 4k:gap-12 text-center">
        {guarantees.map((item, idx) => (
          <div key={idx} className="space-y-2">
            <div className="w-12 h-12 bg-[#FAF0E6] rounded-full flex items-center justify-center mx-auto">
              <item.icon className="w-6 h-6 text-[#8D6E53]" aria-hidden="true" />
            </div>
            <h3 className="font-display font-bold text-base text-[#3A2E2B]">{item.title}</h3>
            <p className="text-xs text-gray-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}