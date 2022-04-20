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
	login: (u) => set({ isAuthenticated: true, user: u }),
	logout: () => set({ isAuthenticated: false }),
}));

export default useStore;
