import React, { useState } from 'react';

export default function Login() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');

	return (
		<>
			<div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
				<div className="max-w-md w-full space-y-8">
					<div>
						<img className="mx-auto h-36 w-auto" src="/gopher.png" alt="Login" />
						<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
							Sign in to your account
						</h2>
						<p className="mt-2 text-center text-sm text-gray-600">
							Or{' '}
							<a
								href="/register"
								className="font-medium text-indigo-600 hover:text-indigo-500"
							>
								Register an account
							</a>
						</p>
					</div>
					<form className="mt-8 space-y-6" action="/v1/login" method="POST">
						<input type="hidden" name="remember" defaultValue="true" />
						<div className="rounded-md shadow-sm -space-y-px">
							<div>
								<label htmlFor="username" className="sr-only">
									Username
								</label>
								<input
									id="username"
									name="username"
									type="text"
									autoComplete="username"
									required
									className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
									placeholder="Username"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
								/>
							</div>
							<div>
								<label htmlFor="password" className="sr-only">
									Password
								</label>
								<input
									id="password"
									name="password"
									type="password"
									autoComplete="current-password"
									required
									className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
									placeholder="Password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
								/>
							</div>
						</div>

						<div>
							<button
								type="submit"
								className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
							>
								Sign in
							</button>
						</div>
					</form>
				</div>
			</div>
		</>
	);
}
