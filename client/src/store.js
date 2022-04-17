import create from 'zustand';

const useStore = create((set) => ({
	selectedColor: 0,
	isAuthenticated: false,
	user: '',
	setSelectedColor: (ind) => set({ selectedColor: ind }),
	login: (u) => set({ isAuthenticated: true, user: u }),
	logout: () => set({ isAuthenticated: false }),
}));

export default useStore;
