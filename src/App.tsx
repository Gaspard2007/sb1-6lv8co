import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { io, Socket } from 'socket.io-client';
import { Globe } from 'lucide-react';

interface UserPosition {
  x: number;
  y: number;
  z: number;
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<number>(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Set up Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    renderer.setSize(window.innerWidth, window.innerHeight);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Add a simple cube to represent the user
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    // Set up Socket.IO connection
    socketRef.current = io('http://localhost:3000'); // Replace with your server URL if different

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
    });

    socketRef.current.on('userJoined', ({ totalUsers }) => {
      setConnectedUsers(totalUsers);
    });

    socketRef.current.on('userLeft', ({ totalUsers }) => {
      setConnectedUsers(totalUsers);
    });

    socketRef.current.on('userMoved', ({ userId, position }: { userId: string, position: UserPosition }) => {
      // Here you would update the position of other users' representations
      console.log(`User ${userId} moved to`, position);
    });

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      socketRef.current?.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const updatePosition = (x: number, y: number, z: number) => {
    if (socketRef.current) {
      socketRef.current.emit('updatePosition', { x, y, z });
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-900">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="absolute top-4 left-4 text-white flex items-center space-x-2">
        <Globe className="w-6 h-6" />
        <span className="text-lg font-semibold">Connected World</span>
        <span className="text-sm">({connectedUsers} users online)</span>
      </div>
    </div>
  );
}

export default App;