<!--
  - MIT License
  -
  - Copyright (c) 2023 JustAnyone
  -
  - Permission is hereby granted, free of charge, to any person obtaining a copy
  - of this software and associated documentation files (the "Software"), to deal
  - in the Software without restriction, including without limitation the rights
  - to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  - copies of the Software, and to permit persons to whom the Software is
  - furnished to do so, subject to the following conditions:
  -
  - The above copyright notice and this permission notice shall be included in all
  - copies or substantial portions of the Software.
  -
  - THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  - IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  - FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  - AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  - LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  - OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  - SOFTWARE.
  -
  -->

<script setup lang="ts">

import {Ref, ref, UnwrapRef} from "vue";
import Button from "primevue/button";
import Select from "primevue/select"
import JSZip from "jszip";
import FileSaver from 'file-saver';

import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';

import {Plugin} from "@/core/plugin/Plugin";
import {Types} from "@/core/Types";
import {DraftFactory} from '@/core/plugin/drafts/Draft';
import {PluginFile} from "@/core/PluginFile";
import Collapsable from "@/components/elements/core/Collapsable.vue";
import AttributeContainer from "@/components/elements/AttributeContainer.vue";


function capitalizeFirstLetter(string: string) {
  let first_letter = string.charAt(0)
  return first_letter.toUpperCase() + string.substring(1)
}

const toast = useToast();


const zipFileUpload = ref(null);
const selectedDraftType = ref(null);
const showPreviewPanel = ref(NODE_ENV === "development");

// Drag-and-drop reordering state for the drafts list
const draggedIndex: Ref<number | null> = ref(null);
const dragOverIndex: Ref<number | null> = ref(null);

function resetDragState() {
  draggedIndex.value = null;
  dragOverIndex.value = null;
}

function onDraftDragStart(index: number, event: DragEvent) {
  draggedIndex.value = index;
  event.dataTransfer.effectAllowed = 'move';
  // Firefox requires data to be set for drag to actually start
  event.dataTransfer.setData('text/plain', String(index));

  // Use the whole draft card as the drag preview instead of just the
  // small grip handle that initiated the drag.
  const card = event.currentTarget.closest('.draft-item');
  if (card) {
    const rect = card.getBoundingClientRect();
    event.dataTransfer.setDragImage(card, event.clientX - rect.left, event.clientY - rect.top);
  }
}

function onDraftDragOver(index: number) {
  if (draggedIndex.value === null) return;
  dragOverIndex.value = index;
}

function onDraftDragLeave(index: number) {
  if (dragOverIndex.value === index) dragOverIndex.value = null;
}

function onDraftDrop(index: number, event: DragEvent) {
  event.preventDefault();
  const from = draggedIndex.value;
  if (from === null || from === index) {
    resetDragState();
    return;
  }
  plugin.value.moveDraft(from, index);
  resetDragState();
}

const types = Array.from(Types.getTypes(), (draftType) => draftType.tag);

function showErrorToast(summary: string, detail: string, life: number = 10000) {
  toast.add({
    severity: 'error',
    summary: summary,
    detail: detail,
    life: life
  })
}

function showWarningToast(summary: string, detail: string, life: number = 10000) {
  toast.add({
    severity: 'warn',
    summary: summary,
    detail: detail,
    life: life
  })
}

function addNewDraft() {
    if (selectedDraftType.value === null) {
      showErrorToast(
          "No draft type specified",
          "Please specify a draft type before trying to add one."
      )
    } else {

      let draft = new DraftFactory().fromType(selectedDraftType.value, plugin.value)
      if (!plugin.value.manifest.author.isEmpty())
        draft.author.value = plugin.value.manifest.author.value

      plugin.value.addDraft(draft);
      selectedDraftType.value = null;
    }
}

const plugin: Ref<Plugin> = ref(null);
plugin.value = new Plugin();

function areDraftsValid() {
  // Validate drafts
  let isValid = true;
  plugin.value.drafts.forEach((draft) => {
    if (!draft.isValid()) isValid = false;
  });
  return isValid;
}

function exportToJson() {
  // Check that the drafts are defined
  if (plugin.value.drafts.length === 0)
    return showErrorToast(
        "Cannot export empty JSON",
        "Make sure you have defined at least one draft before exporting to JSON."
    )

  if (!areDraftsValid())
    return showErrorToast(
      "Could not export JSON",
      "Please ensure all draft attributes are correct."
    )

  FileSaver.saveAs(plugin.value.getJsonBlob(), "code.json")
}

function exportToManifest() {
  if (!plugin.value.isManifestValid())
    return showErrorToast(
      "Could not export manifest",
      "Please ensure all manifest attributes are correct."
    )

  FileSaver.saveAs(plugin.value.getManifestBlob(), "plugin.manifest")
}

function createZipArchive(): JSZip {
  const zip = new JSZip();
  zip.file("code.json", plugin.value.getJsonBlob())
  zip.file("plugin.manifest", plugin.value.getManifestBlob())

  Object.keys(plugin.value.fileMapping).forEach(key => {
    zip.file(key, plugin.value.fileMapping[key].raw)
  })
  return zip
}

function exportToZip() {
  if (plugin.value.drafts.length === 0)
    return showErrorToast(
        "Cannot export an empty plugin",
        "Make sure you have defined at least one draft before exporting as archive."
    )


  if (!areDraftsValid() || !plugin.value.isManifestValid()) return showErrorToast(
      "Could not export archive",
      "Please ensure all plugin attributes are correct."
  );

  createZipArchive().generateAsync({ type: 'blob' }).then(function (content) {
    FileSaver.saveAs(content, 'plugin.zip');
  });
}

function getFilename(path: string) {
  return path.split("/").pop()
}

async function loadFromZip(event: HTMLInputElement) {
  if (!event.files) {
    return showErrorToast(
        "Project loading failed",
        "No file selected."
    );
  }

  if (event.files.length == 0) {
    return showErrorToast(
        "Project loading failed",
        "Cannot load from a non zip file."
    );
  }

  let archive = new JSZip();
  plugin.value = new Plugin()

  let zip = await archive.loadAsync(event.files[0])

  const codeFile = zip.file("code.json")
  const manifestFile = zip.file("plugin.manifest")

  if (codeFile === null || manifestFile === null) {
    return showErrorToast(
        "Project loading failed",
        "Selected zip is not a PCA project."
    );
  }


  // Load the manifest
  let manifestContent = await manifestFile.async("string")
  let jsonObject = JSON.parse(manifestContent);
  console.log(jsonObject)
  plugin.value.manifest.id.value = jsonObject["id"]
  plugin.value.manifest.version.value = jsonObject["version"]
  plugin.value.manifest.title.value = jsonObject["title"]
  plugin.value.manifest.text.value = jsonObject["text"]
  plugin.value.manifest.author.value = jsonObject["author"]



  // Load the code.json file
  let codeContent = await codeFile.async("string")
  jsonObject = JSON.parse(codeContent);

  if (!Array.isArray(jsonObject)) {
    return showErrorToast(
        "Project loading failed",
        "Error loading code: not array"
    );
  }

  jsonObject.forEach((obj) => {
    const draft = new DraftFactory().fromJSON(obj, plugin.value);
    if (draft === null) {
      showWarningToast(
          "Draft loading failed",
          "Unsupported draft type encountered: " + obj["type"] + " for " + obj["id"]
      );
    } else {
      plugin.value.addDraft(draft)
    }
  })

  for (const fileKey in zip.files) {
    const file = zip.files[fileKey]
    // Ignore PCA files
    const fileName = getFilename(file.name)
    if (fileName === "code.json" || fileName === "plugin.manifest") {
      console.log("Ignoring " + file.name)
      continue
    }

    let data = await file.async("uint8array")
    plugin.value.addFile(
        file.name,
        new PluginFile(file.name, data)
    )
  }

  let alreadyVisited: { [key: string]: boolean } = {}
  let enumeratedFileUsages = plugin.value.enumerateFiles()
  enumeratedFileUsages.forEach(item => {
    if (alreadyVisited[item] !== true) {
      plugin.value.getFile(item).owners--;
      alreadyVisited[item] = true
    }
    plugin.value.addFile(item, null)
  });

  return true;
}

window.addEventListener('unhandledrejection', function(event) {
  alert("Error happened while handling promise: " + JSON.stringify(event.reason))
  console.log(event.reason)
  //handle error here
  //event.promise contains the promise object
  //event.reason contains the reason for the rejection
});


window.onerror = function (msg, url, line, col, error) {
  alert("Unexpected error encountered: " + msg)
  //code to handle or report error goes here
}

</script>


<template>
  <Toast position="bottom-right" />

  <div class="main-content">

    <div class="generator-panel">

      <section class="step">
        <div class="step-heading">
          <span class="step-index">1</span>
          <h2>Write the manifest</h2>
        </div>

        <p>
          To begin creating your plugin, please create a manifest of the plugin first. Manifest is a file that
          helps TheoTown to identify and manage your plugin through a graphical interface. Your plugin will also
          show up under local plugins list and the plugins toolbar.
        </p>
        <p>
          If you're new to plugin creation, you might want to check out the documentation
          <a href="https://pca.svetikas.lt/docs/getting-started/writing-a-sample-plugin/"> here</a>.
        </p>

        <Collapsable title="Manifest" heading="h3">
          <AttributeContainer
              :attribute-owner="plugin.manifest"
          />
        </Collapsable>
      </section>

      <section class="step">
        <div class="step-heading">
          <span class="step-index">2</span>
          <h2>Add drafts</h2>
        </div>

        <p>
          Once you've finished writing the manifest, you can begin adding drafts to your plugin.
          A draft is a general term used to refer to a plugin object inside the game. What the draft can do
          is defined by the draft type.
        </p>

        <!-- Type selector for new draft object -->
        <div class="type-selector">
          <Select
            class="type-select"
            v-model="selectedDraftType"
            :options="types"
            filter
            placeholder="Select draft type"
          >
            <template #value="slotProps">
              <div v-if="slotProps.value" class="flex items-center">
                <div>{{ capitalizeFirstLetter(slotProps.value) }}</div>
              </div>
              <span v-else>
                  {{ slotProps.placeholder }}
              </span>
            </template>
            <template #option="slotProps">
              <div class="flex items-center">
                <div>{{ capitalizeFirstLetter(slotProps.option) }}</div>
              </div>
            </template>
          </Select>
          <Button icon="pi pi-plus" label="Add draft" @click="addNewDraft" />
        </div>

        <div v-if="plugin.drafts.length > 0" class="drafts">
          <div
              v-for="(obj, index) in plugin.drafts"
              :key="index"
              class="draft-item marginify"
              :class="{
                'draft-item--dragging': draggedIndex === index,
                'draft-item--drag-over': dragOverIndex === index && draggedIndex !== index
              }"
              @dragover.prevent="onDraftDragOver(index)"
              @dragleave="onDraftDragLeave(index)"
              @drop="onDraftDrop(index, $event)"
          >
            <Collapsable
                :title="`${(index + 1)}. ${obj.id.value ? obj.id.value : 'No ID specified'} (type: ${obj.type.tag})`"
                :removable="true"
                :reorderable="true"
                :can-move-up="index > 0"
                :can-move-down="index < plugin.drafts.length - 1"
                heading="h3"
                @pop="plugin.removeDraftAtIndex(index)"
                @move-up="plugin.moveDraft(index, index - 1)"
                @move-down="plugin.moveDraft(index, index + 1)"
            >
              <template #handle>
                <span
                    class="drag-handle"
                    draggable="true"
                    title="Drag to reorder"
                    @dragstart="onDraftDragStart(index, $event)"
                    @dragend="resetDragState"
                    @click.stop
                >
                  <i class="pi pi-bars"></i>
                </span>
              </template>
              <AttributeContainer
                  :attribute-owner="obj"
              />
            </Collapsable>
          </div>
        </div>
        <p v-else class="empty-drafts">
          <i class="pi pi-inbox"></i>
          No drafts added yet &mdash; pick a draft type above to create your first one.
        </p>
      </section>

      <section class="step">
        <div class="step-heading">
          <span class="step-index">3</span>
          <h2>Export your plugin</h2>
        </div>

        <p>
          Now you can export your plugin to be loaded into the game.
          It is recommended to export the zip archive, as it provides you with a single
          file that you can just put into the game and it just works. It also acts as PCA
          project file, allowing you to restore your project from file.
          If you want to protect the contents
          of the plugin by encryption, read
          <a href="https://pca.svetikas.lt/docs/guides/plugin-encryption/">here</a>
          on how to do so.
        </p>
        <p>
          You can also export the generated JSON and manifest files separately,
          if you prefer to do that instead.
        </p>

        <input
            ref="zipFileUpload"
            accept="application/zip"
            type="file"
            style="display:none;"
            @change="loadFromZip($event.target)"
        />

        <div class="controls">
          <Button class="primary-action" icon="pi pi-download" label="Export as a zip archive" @click="exportToZip()" />
          <Button severity="secondary" outlined icon="pi pi-upload" label="Load from zip" @click="zipFileUpload.click()" />
          <Button severity="secondary" outlined icon="pi pi-file-export" label="Export JSON file" @click="exportToJson()" />
          <Button severity="secondary" outlined icon="pi pi-file-export" label="Export plugin.manifest file" @click="exportToManifest()" />
        </div>
      </section>

    </div>

    <aside v-if="showPreviewPanel" class="preview-panel">
      <div class="preview-heading">
        <i class="pi pi-code"></i>
        <h2>Live preview</h2>
      </div>

      <h3>Files</h3>
      <pre>{{ plugin.fileMapping }}</pre>
      <h3>plugin.manifest</h3>
      <pre>{{ plugin.manifest }}</pre>
      <h3>code.json</h3>
      <pre>{{ plugin.drafts }}</pre>
    </aside>
  </div>

</template>

<style scoped>
.main-content {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
}

.marginify {
  margin-bottom: 1.25rem;
}

.generator-panel {
  flex: 5;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  padding: 1.75rem;
  background-color: var(--app-surface);
  box-shadow: var(--app-shadow-sm);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
}

.step + .step {
  padding-top: 1.75rem;
  border-top: 1px solid var(--app-border);
}

.step-heading {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.85rem;
}

.step-heading h2 {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0;
}

.step-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: var(--app-primary-soft);
  color: var(--app-primary-dark);
  font-weight: 700;
  font-size: 0.9rem;
}

.type-selector {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 1rem 0;
}

.type-select {
  flex: 1;
  min-width: 0;
}

.empty-drafts {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0 0;
  padding: 0.9rem 1rem;
  background: var(--app-surface-soft);
  border: 1px dashed var(--app-border-strong);
  border-radius: var(--app-radius);
  color: var(--app-text-faint);
  font-size: 0.9rem;
}

.drafts {
  margin-top: 0.25rem;
}

.draft-item {
  border-radius: var(--app-radius);
  transition: outline-color .12s ease, opacity .12s ease;
  outline: 2px dashed transparent;
  outline-offset: 4px;
}

.draft-item--dragging {
  opacity: 0.45;
}

.draft-item--drag-over {
  outline-color: var(--app-primary);
}

.drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: var(--app-radius-sm);
  color: var(--app-text-faint);
  cursor: grab;
  transition: background-color .12s ease, color .12s ease;
}

.drag-handle:hover {
  background: var(--app-border);
  color: var(--app-text);
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-handle i {
  font-size: 0.85rem;
}

/* Hide drag-and-drop on touch devices */
@media (hover: none) and (pointer: coarse) {
  .drag-handle {
    display: none;
  }
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1.1rem;
}

.controls :deep(.p-button) {
  flex: 0 0 auto;
  white-space: nowrap;
}

.primary-action {
  font-weight: 700;
}

.preview-panel {
  flex: 2;
  min-width: 280px;
  position: sticky;
  top: 1.25rem;
  max-height: calc(100vh - 2.5rem);
  overflow-y: auto;
  background-color: #10151d;
  color: #d7e0ea;
  padding: 1.25rem;
  border-radius: var(--app-radius-lg);
  box-shadow: var(--app-shadow-sm);
}

.preview-heading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.preview-heading h2 {
  color: #fff;
  font-size: 1rem;
  margin: 0;
}

.preview-panel h3 {
  color: #93a5bd;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 1.25rem 0 0.5rem;
}

.preview-panel pre {
  background: #171f2a;
  border: 1px solid #2a3444;
  border-radius: var(--app-radius-sm);
  padding: 0.75rem;
  font-size: 0.78rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
}

@media (max-width: 640px) {
  .generator-panel {
    padding: 1rem 0.85rem;
    gap: 1.25rem;
  }

  .step + .step {
    padding-top: 1.25rem;
  }

  .type-selector {
    flex-direction: column;
    align-items: stretch;
  }

  .controls {
    flex-direction: column;
  }

  .controls :deep(.p-button) {
    width: 100%;
  }

  .marginify {
    margin-bottom: 0.85rem;
  }
}

@media (max-width: 900px) {
  .main-content {
    flex-direction: column;
  }

  .preview-panel {
    position: static;
    max-height: none;
    width: 100%;
  }
}
</style>
