// Here be the state of the app.

interface AppState {
	dbUser: UserInterface | undefined;
	assistants: { [key: string]: AssistantInterface };
	conversations: { [key: string]: ConversationInterface };
	conversationOrder: string[];
	providers: { [key: string]: ProviderInterface };
	models: { [key: string]: ModelInterface };
	apiKeys: { [key: string]: ApiKeyInterface };
	hiddenItems: Set<string>;
	conversation: ConversationInterface | undefined;
	chatDataLoading: boolean;
	chatStreaming: boolean;
	sidebarOpen: boolean;
	isMobile: boolean;
	conversationUploadOpen: boolean;
	mediaEditing?: MediaInterface;

	mediaUploading: number;
	mediaProcessing: number;

	// Show extra info in the UI.
	debug?: boolean;
}

export const A: AppState = $state({
	dbUser: undefined,
	assistants: {},
	conversations: {},
	conversationOrder: [],
	providers: {},
	models: {},
	apiKeys: {},
	hiddenItems: new Set(),
	conversation: undefined,
	chatDataLoading: false,
	chatStreaming: false,
	sidebarOpen: true,
	isMobile: false,
	conversationUploadOpen: false,

	mediaUploading: 0,
	mediaProcessing: 0,
	debug: true
});
