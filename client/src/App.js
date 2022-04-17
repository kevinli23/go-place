import React, { useEffect, useState, useRef, useCallback } from 'react';
import ColorPalette from './components/ColorPalette';
import AuthPanel from './components/AuthPanel';
import useStore from './store';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
	const [zoom, setZoom] = useState(1);
	const [translateX, setTranslateX] = useState(0);
	const [translateY, setTranslateY] = useState(0);
	const [boardLoadError, setBoardLoadError] = useState(false);
	const [dragging, setDragging] = useState(true);
	const [socketUrl] = useState('ws://localhost:5023/ws');

	const { lastMessage, readyState } = useWebSocket(socketUrl);

	const { selectedColor, isAuthenticated } = useStore();

	const maxZoom = 10;
	const canvasRef = useRef(null);

	const connectionStatus = {
		[ReadyState.CONNECTING]: 'Connecting',
		[ReadyState.OPEN]: 'Open',
		[ReadyState.CLOSING]: 'Closing',
		[ReadyState.CLOSED]: 'Closed',
		[ReadyState.UNINSTANTIATED]: 'Uninstantiated',
	}[readyState];

	useEffect(() => {
		if (lastMessage) {
			const data = JSON.parse(lastMessage.data);
			const s = data['body'];

			const vals = s.split(',');

			const canvas = canvasRef.current;
			const context = canvas.getContext('2d');
			context.fillStyle = colorMapPalette[vals[2]];
			context.fillRect(vals[0], vals[1], 1, 1);
		}
	}, [lastMessage]);

	useEffect(() => {
		console.log(connectionStatus);
	}, [readyState]);

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
			if (e.buttons === 1 && dragging) {
				setTranslateX((prev) =>
					Math.max(-zoom * 1000, Math.min(0, prev - e.movementX))
				);
				setTranslateY((prev) =>
					Math.max(-zoom * 1000, Math.min(0, prev - e.movementY))
				);
			}
		},
		[zoom, dragging]
	);

	const mouseDown = useCallback(
		async (e) => {
			e.preventDefault();

			if (!dragging) {
				const boardSize = 1000 * zoom;
				const pixelSize = boardSize / 250;

				var rect = e.currentTarget.getBoundingClientRect();
				const mx = e.clientX - rect.left;
				const my = e.clientY - rect.top;

				const x = Math.floor(mx / pixelSize);
				const y = Math.floor(my / pixelSize);

				fetch('/v1/place', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'same-origin',
					body: JSON.stringify({
						x: x,
						y: y,
						color: selectedColor,
					}),
				})
					.then((res) => {
						if (res.status === 400) {
							throw new Error('Bad request.');
						} else if (res.status === 401) {
							throw new Error('Please login.');
						} else if (res.status === 500) {
							throw new Error('Something went wrong, please try again later.');
						}
						return res.json();
					})
					.then((data) => {
						if (data['error'] != '') {
							toast(data['error'], {
								position: 'top-center',
								autoClose: 2000,
								hideProgressBar: true,
							});
						}
					})
					.catch((error) => {
						toast.error(error.message, {
							position: 'top-center',
							autoClose: 2000,
							hideProgressBar: true,
							closeOnClick: true,
							pauseOnHover: true,
							draggable: true,
							progress: undefined,
						});
					});
			}
		},
		[zoom, dragging, selectedColor]
	);

	useEffect(() => {
		const getBoard = async () => {
			const res = await fetch('/v1/board');
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

		if (boardColors === null) {
			getBoard()
				.then(() => setBoardLoadError(false))
				.catch(setBoardLoadError(true));
		}
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		const context = canvas.getContext('2d');

		if (boardColors !== null) {
			context.imageSmoothingEnabled = false;
			context.putImageData(boardColors, 0, 0);
			setZoom(1);
		}
	}, [boardColors]);

	useEffect(() => {
		canvasRef.current.addEventListener('mousewheel', mouseZoom);
		canvasRef.current.addEventListener('mousemove', mouseMove);
		canvasRef.current.addEventListener('mousedown', mouseDown);

		return () => {
			if (canvasRef.current) {
				canvasRef.current.removeEventListener('mousewheel', mouseZoom);
				canvasRef.current.removeEventListener('mousemove', mouseMove);
				canvasRef.current.removeEventListener('mousedown', mouseDown);
			}
		};
	}, [zoom, dragging, selectedColor]);

	return (
		<>
			<div className="min-h-screen min-w-screen max-w-screen max-h-screen overflow-hidden p-2 flex flex-col justify-center items-center">
				<div className="min-w-[1004px] max-w-[1004px] min-h-[769px] max-h-[769px] border-black border-2 overflow-hidden">
					<div className="bg-black max-h-[15px] min-h-[15px] flex flex-row align-center justify-end">
						<p className="text-white text-[0.6rem] justify-self-start mr-auto ml-1 font-mono">
							go/Place
						</p>
						<div className="bg-green-400 rounded-full min-h-[10px] min-w-[10px] max-h-[10px] max-w-[10px] mr-1" />
						<div className="bg-yellow-400 rounded-full min-h-[10px] min-w-[10px] max-h-[10px] max-w-[10px] mr-1" />
						<div className="bg-red-400 rounded-full min-h-[10px] min-w-[10px] max-h-[10px] max-w-[10px] mr-1" />
					</div>
					<div className="min-w-full m-h-full overflow-hidden flex flex-col">
						{boardLoadError && (
							<img
								className="top-[20%] w-[300px] h-[200px] self-center absolute"
								src="/construction.png"
							/>
						)}
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
					</div>
				</div>
				<div className="m-2 flex flex-row">
					<ColorPalette />
					<div className="flex flex-col justify-center m-2">
						<button
							type="button"
							className={`m-2 text-white bg-blue-600 hover:bg-blue-800 focus:outline-none w-[50px] h-[50px] ${
								!dragging ? 'border-red-600 border-2' : ''
							} font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center mr-2`}
							onClick={() => setDragging(false)}
						>
							<svg
								className="w-7 h-7"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								></path>
							</svg>
						</button>
						<button
							type="button"
							className={`m-2 text-white bg-blue-700 hover:bg-blue-800 focus:outline-none w-[50px] h-[50px] ${
								dragging ? 'border-red-600 border-2' : ''
							} font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center mr-2`}
							onClick={() => setDragging(true)}
						>
							<svg
								className="w-7 h-7"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
								></path>
							</svg>
						</button>
					</div>
				</div>
				<AuthPanel isAuthenticated={isAuthenticated} />
				<ToastContainer />
			</div>
		</>
	);
}
