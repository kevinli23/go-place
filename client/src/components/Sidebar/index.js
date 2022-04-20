import React from 'react';
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
	const {
		selectedColor,
		setSelectedColor,
		toggleDragging,
		dragging,
	} = useStore();

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
				className={`mt-2 self-center bg-blue-500 border-blue-700 hover:bg-blue-400 text-white font-bold py-2 px-4 hover:border-blue-500 rounded ${
					!dragging && 'border-4 scale-[70%]'
				}`}
				onClick={() => toggleDragging()}
			>
				{dragging ? 'Place' : 'Placing'}
			</button>
		</div>
	);
}
