<script lang="ts">
	import { APIdeleteModel, APIupsertModel } from '$lib/api';
	import { Model } from '$lib/components';
	import { defaultsUUID } from '$lib/db/schema';
	import { toLogin } from '$lib/stores/loginModal';
	import { Plus } from 'lucide-svelte';
	import dbg from 'debug';

	const debug = dbg('app:ui:components:ModelsGrid');

	export let models: { [key: string]: ModelInterface } = {};
	export let provider: ProviderInterface;
	export let dbUser: UserInterface | undefined;
	export let edit = false;
	export let addDefault = false;

	let addingModel = false;
	async function addModel() {
		debug('add model');
		if (!dbUser) {
			toLogin();
			return;
		}
		addingModel = true;
		const newModel = await APIupsertModel({
			userID: addDefault ? defaultsUUID : dbUser.id,
			providerID: provider.id!,
			displayName: 'New Model',
			name: '',
			inputContext: 8000,
			images: false,
			prefill: false
		});
		models[newModel.id!] = newModel;
		addingModel = false;
		debug('new model', newModel);
	}

	async function deleteModel(model: ModelInterface) {
		debug('delete model', model);
		if (!dbUser) {
			toLogin();
			return;
		}
		const del = await APIdeleteModel(model);
		delete models[del.id!];
		models = models;

		debug('delete model done', del);
	}
</script>

<div class="flex flex-col gap-4">
	<div
		class="grid grid-cols-[15rem,auto,min-content,min-content,min-content,min-content,min-content,min-content,min-content] items-center gap-4 gap-y-2">
		<span class="label-text">Display name</span>
		<span class="label-text">Model name</span>
		<span class="label-text w-full">Input context</span>
		<span class="label-text">Images</span>
		<span class="label-text">Audio</span>
		<span class="label-text">Video</span>
		<span class="label-text">Prefill</span>
		<span />
		<span />

		{#each Object.entries(models) as [id, model]}
			{#if model.providerID === provider.id}
				<Model {dbUser} bind:model deleteModel={async () => await deleteModel(model)} {edit} />
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
