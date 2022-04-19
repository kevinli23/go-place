import React from 'react';
import useStore from '../../store';

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

export default function ColorPalette() {
	const { selectedColor, setSelectedColor } = useStore();

	return (
		<>
			<div className="h-[136px] max-w-fit p-1 rounded-lg group bg-gradient-to-br from-orange-600 to-purple-600 group bg-gradient-to-br from-green-400 to-blue-600 group-hover:from-green-400 group-hover:to-blue-600 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800">
				<div className="h-32 max-w-fit flex flex-col justify-center bg-[#93c5fd] rounded-lg p-1">
					{/* <h2 className="font-mono text-center font-bold text-lg">
						GO/PLACE COLOR PICKER
					</h2> */}
					<div className="flex flex-row h-12 mb-px">
						{[0, 1, 2, 3, 4, 5, 6, 7].map((ind) => {
							return (
								<button
									key={ind}
									className={`border-1 h-12 w-12 m-px rounded-lg ${
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
					<div className="flex flex-row h-12">
						{[8, 9, 10, 11, 12, 13, 14, 15].map((ind) => {
							return (
								<button
									key={ind}
									className={`border-1 h-12 w-12 m-px rounded-lg ${
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
			</div>
		</>
	);
}
