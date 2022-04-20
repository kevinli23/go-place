import React, { useEffect, useState } from 'react';
import useStore from '../../store';
import AuthPanel from '../AuthPanel';

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

export default function Sidebar() {
	const isDev = process.env.NODE_ENV === 'development';
	const host = isDev ? 'http://localhost:3000' : '';
	const [inter, setInter] = useState(-1);
	const {
		selectedColor,
		setSelectedColor,
		toggleDragging,
		dragging,
		nextPlaceTime,
		decNextPlaceTime,
		setNextPlaceTime,
	} = useStore();

	useEffect(() => {
		fetch(host + '/v1/next', {
			credentials: isDev ? 'include' : 'same-origin',
		})
			.then((res) => {
				if (res.status === 401) {
					throw new Error('unauthorized');
				}

				return res.json();
			})
			.then((data) => {
				setNextPlaceTime(Math.floor(data['secondsRemaining']));
			})
			.catch((error) => console.log(error));

		return () => clearInterval(inter);
	}, []);

	useEffect(() => {
		if (inter === -1) {
			const i = setInterval(() => decNextPlaceTime(), 1000);
			setInter(i);
		}
		return () => clearInterval(inter);
	}, [nextPlaceTime]);

	const formatSeconds = (seconds) => {
		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;

		return `${minutes}m${secs < 10 ? '0' : ''}${secs}s`;
	};

	return (
		<div className="ml-3 max-h-[390px] min-h-[390px] min-w-[80px] max-w-[80px] bg-[floralwhite] rounded-lg items-start flex flex-col">
			<div className="bg-black max-h-[20px] min-h-[20px] min-w-full flex flex-row items-center justify-end rounded-t-lg">
				<div className="bg-green-400 rounded-full min-h-[10px] min-w-[10px] max-h-[10px] max-w-[10px] mr-1" />
				<div className="bg-yellow-400 rounded-full min-h-[10px] min-w-[10px] max-h-[10px] max-w-[10px] mr-1" />
				<div className="bg-red-400 rounded-full min-h-[10px] min-w-[10px] max-h-[10px] max-w-[10px] mr-1" />
			</div>
			<AuthPanel />
			<div className="flex flex-row justify-center min-w-full">
				<div className="-ml-px flex flex-col m-px max-w-[30px] min-w-[30px]">
					{[0, 1, 2, 3, 4, 5, 6, 7].map((ind) => {
						return (
							<button
								key={ind}
								className={`border-1 h-[30px] w-[30px] m-px rounded-lg ${
									selectedColor === ind
										? 'border-rose-600 border-4'
										: 'border-black border-2'
								}`}
								style={{ backgroundColor: colorMapPalette[ind] }}
								onClick={() => setSelectedColor(ind)}
							>
								<div className="h-full w-full" />
							</button>
						);
					})}
				</div>
				<div className="flex flex-col m-px max-w-[30px] min-w-[30px]">
					{[8, 9, 10, 11, 12, 13, 14, 15].map((ind) => {
						return (
							<button
								key={ind}
								className={`border-1 h-[30px] w-[30px] m-px rounded-lg ${
									selectedColor === ind
										? 'border-rose-600 border-4'
										: 'border-black border-2'
								}`}
								style={{ backgroundColor: colorMapPalette[ind] }}
								onClick={() => setSelectedColor(ind)}
							>
								<div className="h-full w-full" />
							</button>
						);
					})}
				</div>
			</div>
			<button
				className={`mt-2 self-center text-white font-mono py-2 px-4 rounded ${
					!dragging && 'border-2 scale-[80%]'
				} ${
					nextPlaceTime !== 0
						? 'disabled cursor-not-allowed bg-gray-500'
						: 'bg-blue-500 hover:border-blue-500 border-blue-700 hover:bg-blue-400'
				}`}
				onClick={() => {
					if (nextPlaceTime === 0) toggleDragging();
				}}
			>
				{dragging
					? nextPlaceTime === 0
						? 'Place'
						: formatSeconds(nextPlaceTime)
					: 'Placing'}
			</button>
		</div>
	);
}
