import React, { useEffect, useState, useRef, useCallback } from 'react';
import ColorPalette from './components/ColorPalette';
import AuthPanel from './components/AuthPanel';
import useStore from './store';

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

const baseSize = 996;

export default function App() {
	const [boardColors, setBoardColors] = useState(null);
	const [zoom, setZoom] = useState(1);
	const [translateX, setTranslateX] = useState(0);
	const [translateY, setTranslateY] = useState(0);

	const { selectedColor, isAuthenticated } = useStore();

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

	const mouseMove = useCallback(
		(e) => {
			e.preventDefault();
			if (e.buttons === 1) {
				setTranslateX((prev) =>
					Math.max(-zoom * 1000, Math.min(0, prev - e.movementX))
				);
				setTranslateY((prev) =>
					Math.max(-zoom * 1000, Math.min(0, prev - e.movementY))
				);
			}
		},
		[zoom]
	);

	useEffect(() => {
		console.log(zoom, translateX, translateY);
		const canvas = canvasRef.current;
		const context = canvas.getContext('2d');

		context.fillStyle = colorMapPalette[13];
		context.fillRect(200, 200, 1, 1);
	}, [zoom, translateX, translateY]);

	useEffect(() => {
		const getBoard = async () => {
			const res = await fetch('http://localhost:3000/v1/board');
			const data = await res.json();

			const boardBase64 = data['board'];

			const byteArray = Buffer.from(boardBase64, 'base64');

			const unpackedArray = new Uint8Array(Math.min(62500, byteArray.length * 2));

			byteArray.forEach((v, i) => {
				const first = (v & 240) >> 4;
				const second = v & 15;

				unpackedArray[2 * i] = first;
				unpackedArray[2 * i + 1] = second;
			});

			const colorData = new Uint32Array(250 * 250);

			unpackedArray.forEach((v, i) => {
				colorData[i] = colorMapCanvas[v];
			});

			setBoardColors(
				new ImageData(new Uint8ClampedArray(colorData.buffer), 250, 250)
			);
		};

		canvasRef.current.addEventListener('mousewheel', mouseZoom);
		canvasRef.current.addEventListener('mousemove', mouseMove);

		if (boardColors === null) {
			getBoard().catch(console.error);
		}

		return () => {
			canvasRef.current.removeEventListener('mousewheel', mouseZoom);
			canvasRef.current.removeEventListener('mousemove', mouseMove);
		};
	}, [zoom]);

	useEffect(() => {
		const canvas = canvasRef.current;
		const context = canvas.getContext('2d');

		if (boardColors !== null) {
			context.imageSmoothingEnabled = false;
			context.putImageData(boardColors, 0, 0);
		}
	}, [boardColors]);

	return (
		<div className="min-h-screen min-w-screen max-w-screen max-h-screen overflow-hidden p-2 flex flex-col justify-center items-center">
			<div className="min-w-[1004px] max-w-[1004px] min-h-[754px] max-h-[754px] border-black border-2 overflow-hidden">
				<div className="min-w-full m-h-full overflow-hidden flex flex-col">
					<canvas
						id="board"
						ref={canvasRef}
						width="250"
						height="250"
						style={{
							transform: `scale(${zoom}) translate(${translateX}px, ${translateY}px)`,
							transformOrigin: 'top left',
						}}
					></canvas>
					{boardColors === null && <img src="/construction.png" />}
				</div>
			</div>
			<div className="m-2 flex flex-row">
				<ColorPalette />
			</div>
			<AuthPanel isAuthenticated={isAuthenticated} />
		</div>
	);
}
