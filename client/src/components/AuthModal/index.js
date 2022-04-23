import React from 'react';
import useStore from '../../store';
import useLocalStorage from '../../hooks/localstorage';
import { ReactComponent as RedditLogo } from './reddit.svg';

export default function AuthModal() {
	const isDev = process.env.NODE_ENV === 'development';
	const host = isDev ? 'http://localhost:3000' : '';
	const {
		user,
		logout,
		isAuthModalOpen,
		setIsAuthModal,
		isAuthenticated,
	} = useStore();
	const [provider, setProvider] = useLocalStorage('provider', '');

	const auth = async (type) => {
		setProvider(type);
		window.location.href = host + `/auth/${type}`;
	};

	return (
		<>
			{isAuthModalOpen ? (
				<>
					<div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
						<div className="relative w-auto my-6 mx-auto max-w-3xl">
							{/*content*/}
							<div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
								{/*header*/}
								<div className="flex items-start justify-between p-5 border-b border-solid border-slate-200 rounded-t">
									<h3 className="text-3xl font-mono">User Settings</h3>
									<button
										className="p-1 ml-3 ml-auto bg-transparent border-0 text-black float-right text-3xl rounded-full border-black leading-none font-semibold outline-none focus:outline-none"
										onClick={() => setIsAuthModal(false)}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-5 w-5"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fillRule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
												clipRule="evenodd"
											/>
										</svg>
									</button>
								</div>
								{/*body*/}
								{isAuthenticated ? (
									<div className="relative p-6 flex flex-col justify-center items-center">
										<p className="my-4 text-slate-500 text-lg leading-relaxed">{user}</p>
										<button
											className="bg-emerald-500 text-white active:bg-emerald-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
											type="button"
											onClick={() => {
												fetch(host + '/v1/logout', {
													credentials: isDev ? 'include' : 'same-origin',
												})
													.then((res) => res.json())
													.then((data) => {
														console.log(data);
														logout();
														setIsAuthModal(false);
													});
											}}
										>
											Logout
										</button>
									</div>
								) : (
									<div className="flex flex-col min-w-full max-w-full items-center mt-3">
										<>
											<h2 className="font-mono mb-3">Select a login provider</h2>
										</>
										<div className="flex flex-row space-between">
											<button
												type="button"
												className="m-1 text-white bg-[#EA4335] hover:bg-[#EA4335]/80 focus:outline-none font-medium rounded-lg text-sm p-1.5 m-px text-center inline-flex items-center mb-2"
												onClick={() => auth('google')}
											>
												<svg
													className="w-7 h-7 m-0.5"
													aria-hidden="true"
													focusable="false"
													data-prefix="fab"
													data-icon="google"
													role="img"
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 488 512"
												>
													<path
														fill="currentColor"
														d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
													></path>
												</svg>
											</button>
											<button
												type="button"
												className="m-1 text-white bg-[#24292F] focus:outline-none font-medium rounded-lg text-sm p-1.5 text-center m-px inline-flex items-center dark:hover:bg-[#050708] mb-2"
												onClick={() => auth('github')}
											>
												<svg
													className="w-7 h-7 m-0.5"
													aria-hidden="true"
													focusable="false"
													data-prefix="fab"
													data-icon="github"
													role="img"
													xmlns="http://www.w3.org/2000/svg"
													viewBox="0 0 496 512"
												>
													<path
														fill="currentColor"
														d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3 .3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5 .3-6.2 2.3zm44.2-1.7c-2.9 .7-4.9 2.6-4.6 4.9 .3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3 .7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3 .3 2.9 2.3 3.9 1.6 1 3.6 .7 4.3-.7 .7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3 .7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3 .7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
													></path>
												</svg>
											</button>
											<button
												type="button"
												className="m-1 text-white bg-[#24292F] focus:outline-none font-medium rounded-lg text-sm p-1.5 text-center m-px inline-flex items-center dark:hover:bg-[#050708] mb-2"
												onClick={() => auth('reddit')}
											>
												<RedditLogo className="w-7 h-7 m-0.5" />
											</button>
										</div>
									</div>
								)}
								{/*footer*/}
							</div>
						</div>
					</div>
					<div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
				</>
			) : null}
		</>
	);
}
