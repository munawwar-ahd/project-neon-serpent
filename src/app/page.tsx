import SnakeGame from '@/components/game/SnakeGame';

export default function Home() {
  return (
    <main className="relative bg-[#111718] text-white">
      {/* Background visual flair */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent rounded-full blur-[120px]" />
      </div>
      
      <div className="relative z-10">
        <SnakeGame />
      </div>
    </main>
  );
}
