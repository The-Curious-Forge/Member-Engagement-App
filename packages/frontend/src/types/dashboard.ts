import type { SvelteComponent } from 'svelte';

export interface ModuleProps {
	config: ModuleConfig;
	isExpanded: boolean;
}

export type ModuleComponent = new (options: {
	target: HTMLElement;
	props: ModuleProps;
}) => SvelteComponent;

export interface ModuleConfig {
	id: string;
	title: string;
	defaultSize: {
		width: number; // Grid units
		height: number; // Grid units
	};
	isExpandable: boolean;
	defaultPosition: {
		x: number;
		y: number;
	};
	helpContent?: string; // Help text to display in overlay
	isInMaintenance?: boolean; // Whether module is in maintenance mode
	maintenanceMessage?: string; // Custom message to show during maintenance
	styles?: {
		background?: string; // Custom background color/gradient
		headerBackground?: string; // Custom header background
		headerTextColor?: string; // Custom header text color
		contentBackground?: string; // Custom content background
		border?: string; // Custom border style
	};
}

export interface ModulePosition {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface ModuleState {
	id: string;
	position: ModulePosition;
	isExpanded: boolean;
	savedSize?: {
		width: number;
		height: number;
	};
}

export type DashboardLayout = {
	[moduleId: string]: ModuleState;
};

// Module registration type for dynamic module loading
export interface ModuleRegistration {
	config: ModuleConfig;
	component: ModuleComponent;
}

// Available module IDs
export enum ModuleID {
	// Main Dashboard Modules
	MemberOverview = 'member-overview',
	RecentKudos = 'recent-kudos',
	TodayEvents = 'today-events',
	MemberOfMonth = 'member-of-month',
	ProjectOfMonth = 'project-of-month',
	Alerts = 'alerts',
	Mentors = 'mentors',

	// Personal Dashboard Modules
	SignInOut = 'sign-in-out',
	Messages = 'messages',
	Stats = 'stats',
	PersonalKudos = 'personal-kudos',
	Feedback = 'feedback',
	Help = 'help'
}

// Dashboard view types
export enum DashboardView {
	Main = 'main',
	Personal = 'personal'
}

// Extended store interface to support multiple views
export interface DashboardStore {
	layout: DashboardLayout;
	isEditMode: boolean;
	currentView: DashboardView;
	selectedMemberId: string | null;
	isHelpMode: boolean; // Whether help overlay is active
}
