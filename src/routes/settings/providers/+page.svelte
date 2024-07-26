<script lang="ts">
	import { Separator } from '$lib/components/ui/separator';
	import { Input } from '$lib/components/ui/input';
	import { Button } from "$lib/components/ui/button";
	import * as Select from '$lib/components/ui/select';
	import { providerTypes } from '$lib/db/schema';
	export let data;

	import { Accordion } from 'bits-ui';
	import { ChevronDown, Trash, Trash2 } from 'lucide-svelte';
	import { slide } from 'svelte/transition';

	let types = providerTypes.enumValues.map((type) => {
		return { value: type, label: type };
	});

	//     [
	//         { value: "apple", label: "Apple" },
	//         { value: "banana", label: "Banana" },
	//         { value: "blueberry", label: "Blueberry" },
	//         { value: "grapes", label: "Grapes" },
	//         { value: "pineapple", label: "Pineapple" }
	//   ];
</script>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">API providers</h3>
		<!-- <p class="text-muted-foreground text-sm">This is how others will see you on the site.</p> -->
	</div>
	<Separator />

	<Accordion.Root class="w-full sm:max-w-[70%]" multiple>
		{#each data.providers as provider}
			<Accordion.Item value="${provider.id}" class="group border-b border-dark-10 px-1.5">
				<Accordion.Header>
					<Accordion.Trigger
						class="flex w-full flex-1 items-center justify-between py-5 text-[15px] font-medium transition-all [&[data-state=open]>div>span>svg]:rotate-180"
					>
						<div class="div flex items-center">
							<span class="inline-flex size-8 items-center justify-center rounded-[7px] bg-transparent transition-all hover:bg-dark-10">
								<ChevronDown class="size-[18px] transition-all duration-200" />
							</span>
							{provider.name}
						</div>
						<Button variant="outline" size="icon"><Trash2 class="size-5" strokeWidth=1 /></Button>

					</Accordion.Trigger>
				</Accordion.Header>
				<Accordion.Content transition={slide} transitionConfig={{ duration: 200 }} class="pb-[25px] text-sm tracking-[-0.01em]">
					<!-- {item.content} -->
				</Accordion.Content>
			</Accordion.Item>
		{/each}
	</Accordion.Root>

	<!-- {#each data.providers as provider}
		<div class="div flex">
			<Input type="text" bind:value={provider.name} class="max-w-xs" />

			<Select.Root portal={null} bind:selected={provider.type}>
				<Select.Trigger class="w-[180px]">
					<Select.Value />
				</Select.Trigger>
				<Select.Content>
					<Select.Group>

						{#each types as type}
							<Select.Item value={type.value} label={type.label}>{type.label}</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
				<Select.Input name="providerType" />
			</Select.Root>
		</div>
	{/each} -->

	<pre>{JSON.stringify(data, null, 2)}</pre>
</div>
