<script lang="ts">
	import { APIdeleteModel, APIupsertModel } from '$lib/api';
	import { InfoPopup, Model } from '$lib/components';
	import { defaultsUUID } from '$lib/db/schema';
	import { models, dbUser } from '$lib/stores/appstate';
	import { Plus } from 'lucide-svelte';
	import dbg from 'debug';
	import { goto } from '$app/navigation';

	const debug = dbg('app:ui:components:ModelsGrid');

	export let provider: ProviderInterface;
	export let edit;
	export let showDefault: boolean;
	export let showCustom: boolean;
	export let allowHiding = true;

	export let newChildUserID: string;

	let addingModel = false;
	async function addModel() {
		debug('add model');
		if (!$dbUser || !newChildUserID) {
			await goto('/login', { invalidateAll: true });
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
			streaming: true,
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
			await goto('/login', { invalidateAll: true });
		}
		const del = await APIdeleteModel(model);
		models.update((current) => {
			delete current[del.id!];
			return current;
		});
		debug('delete model done', del);
	}

	// {#if model.providerID === provider.id && ((showDefault && model.userID === defaultsUUID) || (showCustom && model.userID !== defaultsUUID))}
	$: modelsToShow = Object.entries($models).filter(
		([id, model]) =>
			model.providerID === provider.id &&
			((showDefault && model.userID === defaultsUUID) || (showCustom && model.userID !== defaultsUUID))
	);
</script>

<div class="flex w-full flex-col gap-4" id="#{provider.id}/models">
	{#if modelsToShow.length !== 0}
		<h2 class="text-xl font-bold">{provider.name} Models</h2>
		<div
			class="grid grid-cols-[15rem,max-content,min-content,min-content,min-content,min-content,min-content,min-content,min-content,min-content,min-content,min-content,min-content,min-content] items-center gap-4 gap-y-2">
			<div class="font-bold">Display name</div>
			<div class="font-bold">Model name</div>
			<div class="relative font-bold">
				Input
				<div class="absolute -top-5">
					<InfoPopup title="Input context length">Maximum number of input tokens the model can process</InfoPopup>
				</div>
			</div>
			<div class="relative font-bold" title="Input cost $ for 1M tokens">
				$/1M
				<div class="absolute -top-5">
					<InfoPopup title="Input cost">Cost in dollars per 1 million input tokens</InfoPopup>
				</div>
			</div>
			<div class="relative font-bold">
				Output
				<div class="absolute -top-5">
					<InfoPopup title="Output context length">Maximum number of output tokens the model can generate</InfoPopup>
				</div>
			</div>
			<div class="relative font-bold" title="Output cost $ per 1M tokens">
				$/1M
				<div class="absolute -top-5">
					<InfoPopup title="Output cost">Cost in dollars per 1 million output tokens</InfoPopup>
				</div>
			</div>
			<div class="font-bold">Max t&deg;</div>
			<!-- <div class="relative flex text-xl font-bold" title="Streaming">
			📡
			<div class="absolute -top-5">
				<InfoPopup title="Model supports streaming"
					>Most models support streaming, OpenAI o1 series being an exception</InfoPopup>
			</div>
		</div> -->

			<div class="relative flex font-bold">
				📝
				<div class="absolute -top-5">
					<InfoPopup title="Model supports prefill"
						>Prefill lets you start the message for the assistant, and the assistant will continue the message.</InfoPopup>
				</div>
			</div>

			<div class="relative flex text-xl font-bold" title="Images">
				🎨
				<div class="absolute -top-5"><InfoPopup title="Model suppurts images" /></div>
			</div>
			<div class="relative flex text-xl font-bold" title="Audio">
				🔉
				<div class="absolute -top-5"><InfoPopup title="Model supports audio" /></div>
			</div>
			<div class="relative flex text-xl font-bold" title="Video">
				📺
				<div class="absolute -top-5"><InfoPopup title="Model supports video" /></div>
			</div>
			<div class="font-bold">Hide</div>
			<div class="font-bold">Delete</div>
			<div></div>

			{#each modelsToShow as [id, model]}
				<!-- {#if model.providerID === provider.id && ((showDefault && model.userID === defaultsUUID) || (showCustom && model.userID !== defaultsUUID))} -->
				<Model bind:model {deleteModel} {edit} {allowHiding} />
				<!-- {/if} -->
			{/each}
		</div>
	{/if}
	{#if edit}
		<button
			class="btn btn-outline w-fit"
			on:click={async () => {
				await addModel();
			}}>
			{#if addingModel}
				<div class="loading"></div>
			{:else}
				<Plus />
			{/if}
			Model
		</button>
	{/if}
</div>
