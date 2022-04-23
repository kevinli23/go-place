import React, { useEffect } from 'react';
import useStore from '../../store';

export default function AuthPanel() {
	const isDev = process.env.NODE_ENV === 'development';
	const host = isDev ? 'http://localhost:3000' : '';

	const { login } = useStore();
	const { isAuthenticated, setIsAuthModal, isAuthModalOpen } = useStore();

	useEffect(() => {
		fetch(host + '/v1/username', {
			credentials: 'include',
		})
			.then((res) => res.json())
			.then((data) => {
				if (data['username'] !== undefined && data['username'] !== null) {
					login(data['username']);
				}
			});
	}, []);

	return (
		<div className="flex flex-row justify-center items-center min-w-full border-black border-b-[1px] mb-1.5 bg-emerald-500 pt-1.5">
			<div className="relative">
				<button
					className="relative overflow-hidden rounded-full bg-white rounded-full hover:bg-gray-300 mb-1.5"
					type="button"
					onClick={() => setIsAuthModal(!isAuthModalOpen)}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-10 w-10 fill-black"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fillRule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
							clipRule="evenodd"
						/>
					</svg>
				</button>
				<span
					className={`top-0 left-6 absolute  w-3.5 h-3.5 ${
						isAuthenticated ? 'bg-green-400' : 'bg-red-400'
					} border-2 border-white dark:border-gray-800 rounded-full`}
				></span>
			</div>
		</div>
	);
}
