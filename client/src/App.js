import React, { useEffect, useState, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Loader from './components/Loader';
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
	const isDev = process.env.NODE_ENV === 'development';
	const host = isDev ? 'http://localhost:3000' : '';

	const [boardColors, setBoardColors] = useState(null);
	const [zoom, setZoom] = useState(1);
	const [translateX, setTranslateX] = useState(0);
	const [translateY, setTranslateY] = useState(0);
	const [boardLoadError, setBoardLoadError] = useState(false);
	const [socketUrl] = useState(
		isDev ? 'ws://localhost:5023/ws' : 'wss://goplace.live/ws'
	);

	const [coord, setCoords] = useState([0, 0]);

	const { lastMessage, readyState } = useWebSocket(socketUrl);

	const {
		selectedColor,
		setNextPlaceTime,
		dragging,
		toggleDragging,
	} = useStore();

	const maxZoom = 10;
	const canvasRef = useRef(null);
	const overlayRef = useRef(null);
	const toastId = useRef(null);

	const constraint = (zoom, viewport) => {
		const blocks = 250;
		const baseSize = 1000;
		const scaledSize = baseSize * zoom;

		const initialBlockSize = baseSize / blocks;
		const currBlockSize = scaledSize / blocks;

		const blockDiff = blocks - viewport / currBlockSize;

		const constraintVal = blockDiff * initialBlockSize;

		return constraintVal;
	};

	const getXandY = (e, zoom) => {
		const boardSize = 1000 * zoom;
		const pixelSize = boardSize / 250;

		var rect = e.currentTarget.getBoundingClientRect();
		const mx = e.clientX - rect.left;
		const my = e.clientY - rect.top;

		const x = Math.floor(mx / pixelSize);
		const y = Math.floor(my / pixelSize);

		return [x, y];
	};

	const connectionStatus = {
		[ReadyState.CONNECTING]: 'Connecting',
		[ReadyState.OPEN]: 'Open',
		[ReadyState.CLOSING]: 'Closing',
		[ReadyState.CLOSED]: 'Closed',
		[ReadyState.UNINSTANTIATED]: 'Uninstantiated',
	}[readyState];

	useEffect(() => {
		console.log(connectionStatus);
	}, [readyState]);

	useEffect(() => {
		if (lastMessage) {
			const data = JSON.parse(lastMessage.data);
			const s = data['body'];

			const vals = s.split(',');

			const canvas = canvasRef.current;
			const context = canvas.getContext('2d');
			context.fillStyle = colorMapPalette[vals[2]];
			context.fillRect(vals[0] - 1, vals[1] - 1, 1, 1);
		}
	}, [lastMessage]);

	const mouseZoom = useCallback((e) => {
		e.preventDefault();
		if (e.deltaY > 0) {
			setZoom((prev) => Math.max(1, prev - 0.25));
		} else if (e.deltaY < 0) {
			setZoom((prev) => Math.min(maxZoom, prev + 0.25));
		}
	}, []);

	useEffect(() => {
		setTranslateX((prev) => Math.max(-constraint(zoom, 1000), Math.min(0, prev)));
		setTranslateY((prev) => Math.max(-constraint(zoom, 750), Math.min(0, prev)));
	}, [zoom]);

	const mouseMove = useCallback(
		(e) => {
			e.preventDefault();
			if (e.buttons === 1 && dragging) {
				setTranslateX((prev) =>
					Math.max(-constraint(zoom, 1000), Math.min(0, prev - e.movementX))
				);
				setTranslateY((prev) =>
					Math.max(-constraint(zoom, 750), Math.min(0, prev - e.movementY))
				);
			}
			setCoords(getXandY(e, zoom));

			const canvas = overlayRef.current;
			const context = canvas.getContext('2d');
			context.clearRect(0, 0, 1000, 750);

			if (!dragging) {
				const blockSize = (zoom * 1000) / 250;

				context.fillStyle = 'rgba(255, 255, 255, 0)';
				context.fillRect(0, 0, 1000, 750);

				context.strokeStyle = '#000000';
				context.setLineDash([zoom, zoom]);

				var cx = e.layerX - (e.layerX % blockSize);
				var cy = e.layerY - (e.layerY % blockSize);

				if (translateX % 4 !== 0 || translateY % 4 !== 0) {
					const boardSize = 1000 * zoom;
					const pixelSize = boardSize / 250;

					var rect = e.currentTarget.getBoundingClientRect();
					const mx = e.clientX - rect.left;
					const my = e.clientY - rect.top;

					const x = Math.floor(mx / pixelSize);
					const y = Math.floor(my / pixelSize);

					cx = (x - Math.abs(translateX) / 4) * blockSize;
					cy = (y - Math.abs(translateY) / 4) * blockSize;
				}

				context.strokeRect(cx, cy, blockSize, blockSize);
			}
		},
		[zoom, dragging, translateX, translateY]
	);

	const mouseDown = useCallback(
		async (e) => {
			e.preventDefault();

			if (!dragging && e.which === 1) {
				const boardSize = 1000 * zoom;
				const pixelSize = boardSize / 250;

				var rect = e.currentTarget.getBoundingClientRect();
				const mx = e.clientX - rect.left;
				const my = e.clientY - rect.top;

				const x = Math.floor(mx / pixelSize);
				const y = Math.floor(my / pixelSize);

				toastId.current = toast.info(`Attempting to place at (${x}, ${y})`, {
					toastId: 'place',
					position: 'top-center',
					autoClose: false,
					hideProgressBar: true,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					progress: undefined,
				});

				fetch(host + `/v1/${isDev ? '' : ''}place`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: isDev ? 'include' : 'same-origin',
					body: JSON.stringify({
						x: x + 1,
						y: y + 1,
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
						if (data['error'] !== '') {
							throw new Error(data['error']);
						}
						setNextPlaceTime(300);
						toggleDragging();
						toast.dismiss(toastId.current);
					})
					.catch((error) => {
						toast.dismiss();

						toast.error(error.message, {
							toastId: 'place-error',
							position: 'top-center',
							autoClose: 1500,
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
			const res = await fetch(host + '/v1/board');
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
	}, [zoom, dragging, selectedColor, translateX, translateY]);

	return (
		<>
			<div className="min-h-screen min-w-screen max-w-screen max-h-screen overflow-hidden p-2 flex flex-row justify-center items-start mt-5">
				<div className="min-w-[1004px] max-w-[1004px] min-h-[774px] max-h-[774px] border-black rounded-t-lg border-2 overflow-hidden">
					<div className="bg-black max-h-[20px] min-h-[20px] flex flex-row items-center justify-center">
						<p className="text-white text-[0.7rem] justify-self-start mr-auto ml-1 font-mono">
							go/place
						</p>
						<p className="text-white text-[0.7rem] justify-self-center mr-auto font-mono">
							{`(${coord[0]}, ${coord[1]}, x${zoom})`}
						</p>
						<div className="bg-green-400 rounded-full min-h-[10px] min-w-[10px] max-h-[10px] max-w-[10px] mr-1" />
						<div className="bg-yellow-400 rounded-full min-h-[10px] min-w-[10px] max-h-[10px] max-w-[10px] mr-1" />
						<div className="bg-red-400 rounded-full min-h-[10px] min-w-[10px] max-h-[10px] max-w-[10px] mr-1" />
					</div>
					<div className="min-w-full min-h-full overflow-hidden flex flex-col">
						{boardLoadError && <Loader />}
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
					<div className="min-w-[1000px] max-h-[750px] overflow-hidden flex flex-col absolute top-0 mt-[50px] pointer-events-none">
						<canvas
							id="overlay"
							className="pointer-events-none"
							ref={overlayRef}
							width="1000"
							height="750"
						></canvas>
					</div>
				</div>
				<Sidebar />
				<ToastContainer />
			</div>
		</>
	);
}
