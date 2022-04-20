import create from 'zustand';

const useStore = create((set) => ({
	selectedColor: 0,
	isAuthenticated: false,
	user: '',
	dragging: true,
	isAuthModalOpen: false,
	nextPlaceTime: 0,
	setSelectedColor: (ind) => set({ selectedColor: ind }),
	setIsAuthModal: (val) => set({ isAuthModalOpen: val }),
	toggleDragging: () =>
		set((state) => ({
			dragging: !state.dragging,
		})),
	setNextPlaceTime: (v) => set({ nextPlaceTime: v }),
	decNextPlaceTime: () =>
		set((state) => ({ nextPlaceTime: Math.max(0, state.nextPlaceTime - 1) })),
	resetNextPlaceTime: () => set({ nextPlaceTime: 300 }),
	login: (u) => set({ isAuthenticated: true, user: u }),
	logout: () => set({ isAuthenticated: false }),
}));

export default useStore;
