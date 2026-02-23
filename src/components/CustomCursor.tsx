import { useEffect, useState, type FC } from 'react';

const CustomCursor: FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      const target = e.target as HTMLElement | null;

      if (target) {
        const computedCursor = window.getComputedStyle(target).cursor;

        setIsPointer(
          computedCursor === 'pointer' ||
            computedCursor === 'grab' ||
            computedCursor === 'grabbing'
        );
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 w-8 h-8 rounded-full border-2 border-indigo-500 pointer-events-none z-[9999] transition-transform duration-100 ease-out flex items-center justify-center"
      style={{
        left: 0,
        top: 0,
        transform: `translate3d(${position.x - 16}px, ${position.y - 16}px, 0) 
                    scale(${isPointer ? 1.5 : 1}) 
                    scale(${isClicking ? 0.8 : 1})`,
        backgroundColor: isPointer ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
      }}
    >
      <div className={`w-1 h-1 bg-indigo-500 rounded-full transition-transform ${isPointer ? 'scale-0' : 'scale-100'}`} />
    </div>
  );
};

export default CustomCursor;
