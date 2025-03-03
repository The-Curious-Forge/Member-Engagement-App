import { writable, derived } from 'svelte/store';
import type {
	DashboardStore,
	DashboardLayout,
	ModuleConfig,
	ModulePosition
} from '../types/dashboard';
import { ModuleID, DashboardView } from '../types/dashboard';

// Default module configurations
const defaultModuleConfigs: Record<ModuleID, ModuleConfig> = {
	// Main Dashboard Modules
	[ModuleID.MemberOverview]: {
		id: ModuleID.MemberOverview,
		title: 'Member Sign-In',
		defaultSize: { width: 5, height: 6 },
		isExpandable: false,
		defaultPosition: { x: 1, y: 2 },
		helpContent:
			'View and manage member information. Click on a member to see their detailed profile, activity history, and manage their status.',
		styles: {
			background: 'linear-gradient(145deg,rgb(249, 246, 244),rgb(243, 241, 241))',
			headerBackground: 'linear-gradient(120deg,rgb(247, 246, 246) 0%,rgb(255, 255, 255) 100%)',
			headerTextColor: '#1a365d',
			contentBackground: '#ffffff',
			border: '3px solid rgb(212, 210, 208)'
		}
	},
	[ModuleID.RecentKudos]: {
		id: ModuleID.RecentKudos,
		title: 'Recent Kudos',
		defaultSize: { width: 1, height: 4 },
		isExpandable: true,
		defaultPosition: { x: 0, y: 0 },
		helpContent:
			'See the latest kudos given to members. Click "See More" to view the full kudos history and give kudos to others.'
	},
	[ModuleID.TodayEvents]: {
		id: ModuleID.TodayEvents,
		title: "Today's Events",
		defaultSize: { width: 2, height: 5 },
		isExpandable: true,
		defaultPosition: { x: 6, y: 0 },
		helpContent:
			'View all events scheduled for today. Click on an event to see details and manage attendance.'
	},
	[ModuleID.MemberOfMonth]: {
		id: ModuleID.MemberOfMonth,
		title: 'Member of the Month',
		defaultSize: { width: 1, height: 2 },
		isExpandable: true,
		defaultPosition: { x: 0, y: 4 },
		helpContent: 'View the current Member of the Month and their achievements.'
	},
	[ModuleID.ProjectOfMonth]: {
		id: ModuleID.ProjectOfMonth,
		title: 'Project of the Month',
		defaultSize: { width: 2, height: 3 },
		isExpandable: true,
		defaultPosition: { x: 6, y: 5 },
		helpContent: 'View the featured Project of the Month and its team members.'
	},
	[ModuleID.Alerts]: {
		id: ModuleID.Alerts,
		title: 'Alerts',
		defaultSize: { width: 5, height: 2 },
		isExpandable: false,
		defaultPosition: { x: 1, y: 0 },
		helpContent:
			'Important notifications and alerts appear here. Click on an alert to take action or mark it as read.'
	},
	[ModuleID.Mentors]: {
		id: ModuleID.Mentors,
		title: 'Mentors',
		defaultSize: { width: 1, height: 3 },
		isExpandable: true,
		defaultPosition: { x: 0, y: 6 },
		helpContent:
			'Find and connect with mentors. View mentor availability and schedule mentoring sessions.'
	},

	// Personal Dashboard Modules
	[ModuleID.SignInOut]: {
		id: ModuleID.SignInOut,
		title: 'Sign In/Out',
		defaultSize: { width: 2, height: 2 },
		isExpandable: true,
		defaultPosition: { x: 0, y: 0 },
		helpContent:
			'Sign in when you arrive and sign out when you leave. Track your time and activity at The Forge.'
	},
	[ModuleID.Messages]: {
		id: ModuleID.Messages,
		title: 'Messages',
		defaultSize: { width: 1, height: 2 },
		isExpandable: true,
		defaultPosition: { x: 2, y: 0 },
		helpContent:
			'View and send messages to other members. Stay connected with the community and get important updates.'
	},
	[ModuleID.Stats]: {
		id: ModuleID.Stats,
		title: 'Stats',
		defaultSize: { width: 2, height: 1 },
		isExpandable: true,
		defaultPosition: { x: 0, y: 2 },
		helpContent:
			'View your activity statistics, including time spent, events attended, and kudos received.'
	},
	[ModuleID.PersonalKudos]: {
		id: ModuleID.PersonalKudos,
		title: 'My Kudos',
		defaultSize: { width: 1, height: 2 },
		isExpandable: true,
		defaultPosition: { x: 3, y: 0 },
		helpContent:
			"Track kudos you've received and given. Celebrate your achievements and recognize others."
	},
	[ModuleID.Feedback]: {
		id: ModuleID.Feedback,
		title: 'Feedback',
		defaultSize: { width: 1, height: 1 },
		isExpandable: false,
		defaultPosition: { x: 2, y: 2 },
		helpContent:
			'Share your thoughts and suggestions. Help us improve The Forge experience for everyone.'
	},
	[ModuleID.Help]: {
		id: ModuleID.Help,
		title: 'Help',
		defaultSize: { width: 1, height: 1 },
		isExpandable: false,
		defaultPosition: { x: 3, y: 2 },
		helpContent:
			'Get help and learn how to use The Forge dashboard. Click the question mark icon to see help for each module.'
	}
};

// Load saved layout from localStorage with SSR support
function loadSavedLayout(view: DashboardView): DashboardLayout | null {
	if (typeof window === 'undefined') return null;

	try {
		const saved = window.localStorage.getItem(`dashboardLayout_${view}`);
		if (!saved) return null;

		const layout = JSON.parse(saved);

		// Get module IDs for the current view
		const moduleIds = Object.keys(defaultModuleConfigs).filter((id) => {
			if (view === DashboardView.Main) {
				return !['sign-in-out', 'messages', 'stats', 'personal-kudos', 'feedback', 'help'].includes(
					id
				);
			} else {
				return ['sign-in-out', 'messages', 'stats', 'personal-kudos', 'feedback', 'help'].includes(
					id
				);
			}
		});

		// Validate loaded layout against current module configs
		Object.entries(layout).forEach(([id, state]) => {
			const config = defaultModuleConfigs[id as ModuleID];
			// Remove if module doesn't exist or doesn't belong to current view
			if (!config || !moduleIds.includes(id)) {
				delete layout[id];
			} else {
				// Only ensure position is within grid bounds (8x8 grid)
				const moduleState = state as {
					id: string;
					position: ModulePosition;
					isExpanded: boolean;
				};
				const position = moduleState.position;
				position.x = Math.min(position.x, 8 - position.width);
				position.y = Math.min(position.y, 8 - position.height);
			}
		});

		return layout;
	} catch (error) {
		console.error('Error loading dashboard layout:', error);
		return null;
	}
}

// Save layout to localStorage with SSR support
function saveLayout(layout: DashboardLayout, view: DashboardView): void {
	if (typeof window === 'undefined') return;

	try {
		window.localStorage.setItem(`dashboardLayout_${view}`, JSON.stringify(layout));
	} catch (error) {
		console.error('Error saving dashboard layout:', error);
	}
}

// Create initial layout for a specific view
function createInitialLayout(view: DashboardView): DashboardLayout {
	const layout: DashboardLayout = {};
	Object.entries(defaultModuleConfigs).forEach(([id, config]) => {
		// Only include modules for the current view
		const isPersonalModule = [
			'sign-in-out',
			'messages',
			'stats',
			'personal-kudos',
			'feedback',
			'help'
		].includes(id);
		if ((view === DashboardView.Personal) === isPersonalModule) {
			layout[id] = {
				id,
				position: {
					x: config.defaultPosition.x,
					y: config.defaultPosition.y,
					width: config.defaultSize.width,
					height: config.defaultSize.height
				},
				isExpanded: false,
				savedSize: {
					width: config.defaultSize.width,
					height: config.defaultSize.height
				}
			};
		}
	});
	return layout;
}

// Initialize the store
function createDashboardStore() {
	const initialView = DashboardView.Main;
	const savedLayout = loadSavedLayout(initialView);
	const initialState: DashboardStore = {
		layout: savedLayout || createInitialLayout(initialView),
		isEditMode: false,
		currentView: initialView,
		selectedMemberId: null,
		isHelpMode: false
	};

	const { subscribe, update } = writable<DashboardStore>(initialState);

	// Save layout to localStorage whenever it changes
	subscribe((state) => {
		if (!state.isEditMode) {
			// Only save when not in edit mode
			saveLayout(state.layout, state.currentView);
		}
	});

	return {
		subscribe,

		toggleEditMode: () =>
			update((state) => {
				// If leaving edit mode, save the layout
				if (state.isEditMode) {
					saveLayout(state.layout, state.currentView);
				}
				return {
					...state,
					isEditMode: !state.isEditMode,
					isHelpMode: false // Disable help mode when entering edit mode
				};
			}),

		toggleHelpMode: () =>
			update((state) => ({
				...state,
				isHelpMode: !state.isHelpMode,
				isEditMode: false // Disable edit mode when entering help mode
			})),

		resetLayout: () =>
			update((state) => ({
				...state,
				layout: createInitialLayout(state.currentView)
			})),

		updateModulePosition: (moduleId: ModuleID, position: ModulePosition) =>
			update((state) => {
				if (!state.isEditMode) return state;

				const newLayout = { ...state.layout };
				newLayout[moduleId] = {
					...newLayout[moduleId],
					position
				};
				return { ...state, layout: newLayout };
			}),

		toggleExpand: (moduleId: ModuleID) =>
			update((state) => {
				if (state.isEditMode) return state;

				const module = state.layout[moduleId];
				const config = defaultModuleConfigs[moduleId];

				if (!module || !config.isExpandable) return state;

				const newLayout = { ...state.layout };

				if (!module.isExpanded) {
					// Store current size before expanding
					newLayout[moduleId] = {
						...module,
						isExpanded: true,
						savedSize: {
							width: module.position.width,
							height: module.position.height
						},
						position: {
							...module.position,
							width: 5, // Use most of the grid when expanded
							height: 4
						}
					};
				} else {
					// Restore saved size when collapsing
					newLayout[moduleId] = {
						...module,
						isExpanded: false,
						position: {
							...module.position,
							width: module.savedSize?.width || config.defaultSize.width,
							height: module.savedSize?.height || config.defaultSize.height
						}
					};
				}
				return { ...state, layout: newLayout };
			}),

		resizeModule: (moduleId: ModuleID, newSize: { width: number; height: number }) =>
			update((state) => {
				if (!state.isEditMode) return state;

				const module = state.layout[moduleId];
				const config = defaultModuleConfigs[moduleId];
				if (!module || !config) return state;

				// Only enforce grid boundary constraints
				const width = newSize.width;
				const height = newSize.height;

				// Ensure module stays within grid bounds (8x8 grid)
				const x = Math.min(module.position.x, 8 - width);
				const y = Math.min(module.position.y, 8 - height);

				const newLayout = { ...state.layout };
				newLayout[moduleId] = {
					...module,
					position: {
						...module.position,
						width,
						height,
						x,
						y
					},
					// Update savedSize when resizing in non-expanded state
					...(module.isExpanded
						? {}
						: {
								savedSize: {
									width,
									height
								}
							})
				};
				return { ...state, layout: newLayout };
			}),

		switchView: (view: DashboardView) =>
			update((state) => {
				// Save current layout before switching
				if (!state.isEditMode) {
					saveLayout(state.layout, state.currentView);
				}

				// Load layout for new view
				const newLayout = loadSavedLayout(view) || createInitialLayout(view);

				return {
					...state,
					currentView: view,
					layout: newLayout,
					isEditMode: false,
					isHelpMode: false,
					selectedMemberId: null
				};
			}),

		switchToMemberDashboard: (memberId: string) =>
			update((state) => {
				// Save current layout before switching
				if (!state.isEditMode) {
					saveLayout(state.layout, state.currentView);
				}

				// Load layout for personal view
				const newLayout =
					loadSavedLayout(DashboardView.Personal) || createInitialLayout(DashboardView.Personal);

				return {
					...state,
					currentView: DashboardView.Personal,
					layout: newLayout,
					isEditMode: false,
					isHelpMode: false,
					selectedMemberId: memberId
				};
			})
	};
}

const store = createDashboardStore();

// Create the stores with proper typing
export const dashboardStore = {
	subscribe: store.subscribe,
	toggleEditMode: store.toggleEditMode,
	toggleHelpMode: store.toggleHelpMode,
	resetLayout: store.resetLayout,
	updateModulePosition: store.updateModulePosition,
	toggleExpand: store.toggleExpand,
	resizeModule: store.resizeModule,
	switchView: store.switchView,
	switchToMemberDashboard: store.switchToMemberDashboard
};

// Derived store for module configurations
export const moduleConfigs = derived(store, () => defaultModuleConfigs);
