// Here be the state of the app.

interface AppState {
	user: UserInterface | undefined;
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
	conversationDragging: number;
	messageDragging: number;

	mediaEditing?: MediaInterface;

	mediaUploading: number;
	mediaProcessing: number;

	// Show extra info in the UI.
	debug?: boolean;
}

export const A: AppState = $state({
	user: undefined,
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
	conversationDragging: 0,
	messageDragging: 0,

	mediaUploading: 0,
	mediaProcessing: 0,
	debug: false
});
