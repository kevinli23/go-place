import create from 'zustand';

const useStore = create((set) => ({
	selectedColor: 0,
	isAuthenticated: false,
	user: '',
	dragging: false,
	setSelectedColor: (ind) => set({ selectedColor: ind }),
	toggleDragging: () =>
		set((state) => ({
			dragging: !state.dragging,
		})),
	login: (u) => set({ isAuthenticated: true, user: u }),
	logout: () => set({ isAuthenticated: false }),
}));

export default useStore;
