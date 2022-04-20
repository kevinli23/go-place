import React, { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import useStore from '../../store';

export default function AuthModal() {
	const isDev = process.env.NODE_ENV === 'development';
	const host = isDev ? 'http://localhost:3000' : '';
	const { user, logout, isAuthModalOpen, setIsAuthModal } = useStore();

	useEffect(() => {
		console.log(isAuthModalOpen);
	}, [isAuthModalOpen]);

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
									<h3 className="text-3xl font-semibold">User Settings</h3>
									<button
										className="p-1 ml-auto bg-transparent border-0 text-black float-right text-3xl rounded-full border-black leading-none font-semibold outline-none focus:outline-none"
										onClick={() => setIsAuthModal(false)}
									>
										<span className="text-black h-6 w-6 text-2xl block outline-none focus:outline-none">
											×
										</span>
									</button>
								</div>
								{/*body*/}
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
