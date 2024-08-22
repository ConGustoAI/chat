<script lang="ts">
	import { APIdeleteModel, APIupsertModel } from '$lib/api';
	import { Model } from '$lib/components';
	import { defaultsUUID } from '$lib/db/schema';
	import { toLogin } from '$lib/stores/loginModal';
	import { models, dbUser } from '$lib/stores/appstate';
	import { Plus } from 'lucide-svelte';
	import dbg from 'debug';

	const debug = dbg('app:ui:components:ModelsGrid');

	export let provider: ProviderInterface;
	export let edit;
	export let showDefault: boolean;
	export let showCustom: boolean;
	export let allowHiding = true;

	export let newChildUserID: string | undefined;

	let addingModel = false;
	async function addModel() {
		debug('add model');
		if (!$dbUser || !newChildUserID) {
			toLogin();
			return;
		}
		addingModel = true;
		const newModel = await APIupsertModel({
			userID: newChildUserID,
			providerID: provider.id!,
			displayName: 'New Model',
			name: '',
			inputContext: 8192,
			outputContext: 4096,
			maxTemp: 2,
			images: false,
			prefill: false
		});
		models.update((current) => {
			current[newModel.id!] = newModel;
			return current;
		});
		addingModel = false;
		debug('new model', newModel);
	}

	async function deleteModel(model: ModelInterface) {
		debug('delete model', model);
		const user = $dbUser;
		if (!user) {
			toLogin();
			return;
		}
		const del = await APIdeleteModel(model);
		models.update((current) => {
			delete current[del.id!];
			return current;
		});
		debug('delete model done', del);
	}
</script>

<div class="flex w-full flex-col gap-4">
	<div
		class="grid grid-cols-[15rem,auto,min-content,min-content,min-content,min-content,min-content,min-content,min-content,min-content,min-content,min-content] items-center gap-4 gap-y-2">
		<div class="label-text">Display name</div>
		<div class="label-text">Model name</div>
		<div class="label-text w-full">Input</div>
		<div class="label-text w-full">Output</div>
		<div class="label-text">Max t&deg;</div>
		<div class="label-text text-xl" title="Images">🎨</div>
		<div class="label-text text-xl" title="Audio">🔉</div>
		<div class="label-text text-xl" title="Video">📺</div>
		<div class="label-text">Prefill</div>
		<div class="font-bold">Hide</div>
		<div class="font-bold">Delete</div>
		<div />

		{#each Object.entries($models) as [id, model]}
			{#if model.providerID === provider.id && ((showDefault && model.userID === defaultsUUID) || (showCustom && model.userID !== defaultsUUID))}
				<Model bind:model {deleteModel} {edit} {allowHiding} />
			{/if}
		{/each}
	</div>
	{#if edit}
		<button
			class="btn btn-outline w-fit"
			on:click={async () => {
				await addModel();
			}}>
			{#if addingModel}
				<div class="loading" />
			{:else}
				<Plus />
			{/if}
			Model
		</button>
	{/if}
</div>
