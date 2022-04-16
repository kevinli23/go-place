import React, { useEffect, useState, useRef, useCallback } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import { Buffer } from 'buffer';

const colorMapCanvas = {
	0: 0xffffffff,
	1: 0xffe4e4e4,
	2: 0xff888888,
	3: 0xff222222,
	4: 0xffd1a7ff,
	5: 0xff0000e5,
	6: 0xff0095e5,
	7: 0xff426aa0,
	8: 0xff00d9e5,
	9: 0xff44e094,
	10: 0xff01be02,
	11: 0xffddd300,
	12: 0xffc78300,
	13: 0xffea0000,
	14: 0xffe46ecf,
	15: 0xff800082,
};

const colorMapPalette = {
	0: '#FFFFFF',
	1: '#E4E4E4',
	2: '#888888',
	3: '#222222',
	4: '#FFA7D1',
	5: '#E50000',
	6: '#E59500',
	7: '#A06A42',
	8: '#E5D900',
	9: '#94E044',
	10: '#02BE01',
	11: '#00D3DD',
	12: '#0083C7',
	13: '#0000EA',
	14: '#CF6EE4',
	15: '#820080',
};

export default function App() {
	const [boardColors, setBoardColors] = useState(null);
	const [zoom, setZoom] = useState(5);
	const [mouseDown, setMouseDown] = useState(false);
	const [translateX, setTranslateX] = useState(0);
	const [translateY, setTranslateY] = useState(0);
	const [mx, setMx] = useState(0);
	const [my, setMy] = useState(0);

	const maxZoom = 10;
	const canvasRef = useRef(null);

	const mouseZoom = useCallback((e) => {
		e.preventDefault();
		if (e.deltaY > 0) {
			setZoom((prev) => Math.max(1, prev - 0.25));
		} else if (e.deltaY < 0) {
			setZoom((prev) => Math.min(maxZoom, prev + 0.25));
		}
	}, []);

	useEffect(() => {
		console.log(zoom);
	}, [zoom]);

	useEffect(() => {
		const getBoard = async () => {
			const res = await fetch('http://localhost:3000/v1/board');
			const data = await res.json();

			const boardBase64 = data['board'];

			const byteArray = Buffer.from(boardBase64, 'base64');

			console.log(byteArray.length);

			const unpackedArray = new Uint8Array(Math.min(62500, byteArray.length * 2));

			byteArray.forEach((v, i) => {
				const first = (v & 240) >> 4;
				const second = v & 15;

				unpackedArray[2 * i] = first;
				unpackedArray[2 * i + 1] = second;
			});

			const colorData = new Uint32Array(250 * 250);

			unpackedArray.forEach((v, i) => {
				colorData[i] = colorMapCanvas[(v + 3) % 15];
			});

			setBoardColors(
				new ImageData(new Uint8ClampedArray(colorData.buffer), 250, 250)
			);
		};

		canvasRef.current.addEventListener('mousewheel', mouseZoom);

		getBoard().catch(console.error);

		return () => {
			canvasRef.current.removeEventListener('mousewheel', mouseZoom);
		};
	}, []);

	useEffect(() => {
		if (boardColors !== null) {
			const canvas = canvasRef.current;
			const context = canvas.getContext('2d');
			context.putImageData(boardColors, 0, 0);
			context.imageSmoothingEnabled = false;
		}
	}, [boardColors]);

	return (
		<div class="min-h-screen min-w-screen m-2.5 border-black border-2 overflow-hidden">
			<canvas
				id="board"
				ref={canvasRef}
				width="250"
				height="250"
				style={{
					transform: `scale(${zoom}) translate(${translateX}, ${translateY})`,
				}}
			></canvas>
		</div>
	);
}
