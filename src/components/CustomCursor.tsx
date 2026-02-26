import { useEffect, useState, type FC } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

const CustomCursor: FC = () => {
  const [isPointer, setIsPointer] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 250 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

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
  }, [cursorX, cursorY]);

  return (
    <>
      {/* Outer Ring */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-indigo-500/50 pointer-events-none z-[9999] flex items-center justify-center bg-indigo-500/5 backdrop-blur-[2px]"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: "-50%",
          translateY: "-50%",
          scale: isPointer ? 1.5 : 1,
        }}
        animate={{
          scale: isClicking ? 0.8 : (isPointer ? 1.5 : 1),
          borderColor: isPointer ? "rgba(99, 102, 241, 0.8)" : "rgba(99, 102, 241, 0.4)",
        }}
      />

      {/* Inner Dot */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-indigo-600 rounded-full pointer-events-none z-[9999]"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: isPointer ? 0 : 1,
        }}
      />
    </>
  );
};

export default CustomCursor;
