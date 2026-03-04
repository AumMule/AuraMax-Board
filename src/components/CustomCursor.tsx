import { useEffect, useState, type FC } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

const CustomCursor: FC = () => {
  const [isPointer, setIsPointer] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isText, setIsText] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Slower, heavier ring for the trailing aura
  const ringConfig = { damping: 30, stiffness: 200 };
  const ringX = useSpring(cursorX, ringConfig);
  const ringY = useSpring(cursorY, ringConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      const target = e.target as HTMLElement | null;
      if (target) {
        const computed = window.getComputedStyle(target).cursor;
        setIsPointer(computed === 'pointer' || computed === 'grab' || computed === 'grabbing');
        setIsText(computed === 'text');
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
      {/* Aura ring — trails slightly behind */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full"
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isPointer ? 40 : isClicking ? 20 : 28,
          height: isPointer ? 40 : isClicking ? 20 : 28,
          backgroundColor: isPointer
            ? 'rgba(249, 115, 22, 0.08)'
            : 'transparent',
          border: isPointer
            ? '1.5px solid rgba(249, 115, 22, 0.5)'
            : isText
              ? '1.5px solid rgba(255,255,255,0.2)'
              : '1.5px solid rgba(255, 255, 255, 0.15)',
          scale: isClicking ? 0.8 : 1,
        }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      />

      {/* Sharp center dot — snaps instantly */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isText ? 2 : isPointer ? 0 : 4,
          height: isText ? 16 : isPointer ? 0 : 4,
          backgroundColor: isPointer
            ? 'transparent'
            : isText
              ? 'rgba(255,255,255,0.5)'
              : '#f97316',
          borderRadius: isText ? '1px' : '50%',
          opacity: isClicking ? 0.6 : 1,
          scale: isClicking ? 0.6 : 1,
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
      />

      {/* Click ripple */}
      {isClicking && (
        <motion.div
          className="fixed top-0 left-0 pointer-events-none z-[9998] rounded-full border border-orange-500/30"
          style={{
            x: cursorX,
            y: cursorY,
            translateX: '-50%',
            translateY: '-50%',
          }}
          initial={{ width: 8, height: 8, opacity: 0.6 }}
          animate={{ width: 40, height: 40, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      )}
    </>
  );
};

export default CustomCursor;
