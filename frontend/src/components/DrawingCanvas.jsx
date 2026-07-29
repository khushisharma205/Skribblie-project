import { useEffect, useRef, useState } from 'react';
import { socket } from '../services/socket';
import Toolbar from './Toolbar.jsx';

const WHITE = '#ffffff';

export default function DrawingCanvas({ isDrawer, resetSignal }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isPointerDownRef = useRef(false);
  const strokesRef = useRef([]); // completed + in-progress strokes for redraw/undo

  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(8);
  const [isEraser, setIsEraser] = useState(false);

  const getContext = () => {
    if (!ctxRef.current && canvasRef.current) {
      ctxRef.current = canvasRef.current.getContext('2d');
    }
    return ctxRef.current;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = WHITE;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const redrawAll = () => {
    clearCanvas();
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    for (const stroke of strokesRef.current) {
      if (stroke.points.length < 1) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const first = stroke.points[0];
      ctx.moveTo(first.x * canvas.width, first.y * canvas.height);
      for (const pt of stroke.points.slice(1)) {
        ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
      }
      ctx.stroke();
    }
  };

  // Reset the canvas whenever a new round/turn begins.
  useEffect(() => {
    strokesRef.current = [];
    clearCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      clearCanvas();
    }

    const onDrawData = (data) => {
      const ctx = getContext();
      const c = canvasRef.current;
      if (!ctx || !c) return;

      if (data.type === 'start') {
        strokesRef.current.push({ color: data.color, size: data.size, points: [{ x: data.x, y: data.y }] });
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(data.x * c.width, data.y * c.height);
      } else if (data.type === 'move') {
        const current = strokesRef.current[strokesRef.current.length - 1];
        if (current) current.points.push({ x: data.x, y: data.y });
        ctx.lineTo(data.x * c.width, data.y * c.height);
        ctx.stroke();
      }
      // 'end' requires no action; path is already fully drawn incrementally.
    };

    const onCanvasClear = () => {
      strokesRef.current = [];
      clearCanvas();
    };

    const onDrawUndo = () => {
      strokesRef.current.pop();
      redrawAll();
    };

    socket.on('draw_data', onDrawData);
    socket.on('canvas_clear', onCanvasClear);
    socket.on('draw_undo', onDrawUndo);

    return () => {
      socket.off('draw_data', onDrawData);
      socket.off('canvas_clear', onCanvasClear);
      socket.off('draw_undo', onDrawUndo);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getRelativePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    };
  };

  const handlePointerDown = (e) => {
    if (!isDrawer) return;
    e.preventDefault();
    isPointerDownRef.current = true;
    const { x, y } = getRelativePos(e);
    socket.emit('draw_start', { x, y, color: isEraser ? WHITE : color, size: isEraser ? Math.max(size, 20) : size });
  };

  const handlePointerMove = (e) => {
    if (!isDrawer || !isPointerDownRef.current) return;
    e.preventDefault();
    const { x, y } = getRelativePos(e);
    socket.emit('draw_move', { x, y });
  };

  const handlePointerUp = (e) => {
    if (!isDrawer || !isPointerDownRef.current) return;
    e.preventDefault();
    isPointerDownRef.current = false;
    socket.emit('draw_end', {});
  };

  const handleUndo = () => socket.emit('draw_undo');
  const handleClear = () => socket.emit('canvas_clear');

  return (
    <div className="canvas-area">
      <canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />
      <Toolbar
        color={color}
        setColor={setColor}
        size={size}
        setSize={setSize}
        isEraser={isEraser}
        setIsEraser={setIsEraser}
        onUndo={handleUndo}
        onClear={handleClear}
        disabled={!isDrawer}
      />
    </div>
  );
}
