import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import Image from "next/image";
import { LLMModel, LLMModelConfig } from "@/lib/models";
import { TemplateId, Templates } from "@/lib/templates";
import { Settings2, Sparkles } from "lucide-react";
import { Button } from "./ui/button";

export default function ModelSelector({
  templates,
  selectedTemplate,
  onSelectedTemplateChange,
  models,
  languageModel,
  onLanguageModelChange,
  apiKeyConfigurable,
  baseURLConfigurable,
}: {
  templates: Templates;
  selectedTemplate: "auto" | TemplateId;
  onSelectedTemplateChange: (template: "auto" | TemplateId) => void;
  models: LLMModel[];
  languageModel: LLMModelConfig;
  onLanguageModelChange: (config: LLMModelConfig) => void;
  apiKeyConfigurable: boolean;
  baseURLConfigurable: boolean;
}) {
  return (
    <div className="flex w-full items-center space-x-2">
      <div className="flex flex-col">
        <Select
          name="template"
          defaultValue={selectedTemplate}
          onValueChange={onSelectedTemplateChange}
        >
          <SelectTrigger className="w-[200px] whitespace-nowrap shadow-none px-1 py-0 h-6 text-xs">
            <SelectValue placeholder="Select a persona" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectGroup>
              <SelectLabel>Persona</SelectLabel>
              <SelectItem value="auto">
                <div className="flex items-center space-x-1">
                  <Sparkles
                    className="flex text-[#a1a1aa]"
                    width={14}
                    height={14}
                  />
                  <span>Auto</span>
                </div>
              </SelectItem>
              {Object.entries(templates).map(([templateId, template]) => (
                <SelectItem key={templateId} value={templateId}>
                  <div className="flex items-center space-x-2">
                    <Image
                      className="flex"
                      src={`/thirdparty/templates/${templateId}.svg`}
                      alt={templateId}
                      width={14}
                      height={14}
                    />
                    <span>{template.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col">
        <Select
          name="languageModel"
          defaultValue={languageModel.model}
          onValueChange={(e) => onLanguageModelChange({ model: e })}
        >
          <SelectTrigger className="w-[200px] whitespace-nowrap text-xs shadow-none px-1 py-0 h-6">
            <SelectValue placeholder="Language model" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(
              Object.groupBy(models, ({ provider }) => provider)
            ).map(([provider, models]) => (
              <SelectGroup key={provider}>
                <SelectLabel>{provider}</SelectLabel>
                {models?.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center space-x-1">
                      <Image
                        className="flex"
                        src={`/thirdparty/logos/${model.providerId}.svg`}
                        alt={model.provider}
                        width={14}
                        height={14}
                      />
                      <span>{model.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-6 w-6">
            <Settings2 className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {apiKeyConfigurable && (
            <>
              <div className="flex flex-col gap-1.5 px-2 py-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  name="apiKey"
                  type="text"
                  placeholder="Auto"
                  required={true}
                  defaultValue={languageModel.apiKey}
                  onChange={(e) =>
                    onLanguageModelChange({
                      apiKey:
                        e.target.value.length > 0 ? e.target.value : undefined,
                    })
                  }
                  className="text-sm"
                />
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          {baseURLConfigurable && (
            <>
              <div className="flex flex-col gap-1.5 px-2 py-2">
                <Label htmlFor="baseURL">Base URL</Label>
                <Input
                  name="baseURL"
                  type="text"
                  placeholder="Auto"
                  required={true}
                  defaultValue={languageModel.baseURL}
                  onChange={(e) =>
                    onLanguageModelChange({
                      baseURL:
                        e.target.value.length > 0 ? e.target.value : undefined,
                    })
                  }
                  className="text-sm"
                />
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          <div className="flex gap-1.5 px-2 py-2 items-center space-x-4">
            <span className="text-sm flex-1">Output tokens</span>
            <Input
              type="number"
              defaultValue={languageModel.maxTokens}
              min={50}
              max={10000}
              step={1}
              className="h-6 rounded-sm w-[84px] text-xs text-center tabular-nums"
              placeholder="Auto"
              onChange={(e) =>
                onLanguageModelChange({
                  maxTokens: parseFloat(e.target.value) || undefined,
                })
              }
            />
          </div>
          <div className="flex gap-1.5 px-2 py-2 items-center space-x-4">
            <span className="text-sm flex-1">Temperature</span>
            <Input
              type="number"
              defaultValue={languageModel.temperature}
              min={0}
              max={5}
              step={0.01}
              className="h-6 rounded-sm w-[84px] text-xs text-center tabular-nums"
              placeholder="Auto"
              onChange={(e) =>
                onLanguageModelChange({
                  temperature: parseFloat(e.target.value) || undefined,
                })
              }
            />
          </div>
          <div className="flex gap-1.5 px-2 py-2 items-center space-x-4">
            <span className="text-sm flex-1">Top P</span>
            <Input
              type="number"
              defaultValue={languageModel.topP}
              min={0}
              max={1}
              step={0.01}
              className="h-6 rounded-sm w-[84px] text-xs text-center tabular-nums"
              placeholder="Auto"
              onChange={(e) =>
                onLanguageModelChange({
                  topP: parseFloat(e.target.value) || undefined,
                })
              }
            />
          </div>
          <div className="flex gap-1.5 px-2 py-2 items-center space-x-4">
            <span className="text-sm flex-1">Top K</span>
            <Input
              type="number"
              defaultValue={languageModel.topK}
              min={0}
              max={500}
              step={1}
              className="h-6 rounded-sm w-[84px] text-xs text-center tabular-nums"
              placeholder="Auto"
              onChange={(e) =>
                onLanguageModelChange({
                  topK: parseFloat(e.target.value) || undefined,
                })
              }
            />
          </div>
          <div className="flex gap-1.5 px-2 py-2 items-center space-x-4">
            <span className="text-sm flex-1">Frequence penalty</span>
            <Input
              type="number"
              defaultValue={languageModel.frequencyPenalty}
              min={0}
              max={2}
              step={0.01}
              className="h-6 rounded-sm w-[84px] text-xs text-center tabular-nums"
              placeholder="Auto"
              onChange={(e) =>
                onLanguageModelChange({
                  frequencyPenalty: parseFloat(e.target.value) || undefined,
                })
              }
            />
          </div>
          <div className="flex gap-1.5 px-2 py-2 items-center space-x-4">
            <span className="text-sm flex-1">Presence penalty</span>
            <Input
              type="number"
              defaultValue={languageModel.presencePenalty}
              min={0}
              max={2}
              step={0.01}
              className="h-6 rounded-sm w-[84px] text-xs text-center tabular-nums"
              placeholder="Auto"
              onChange={(e) =>
                onLanguageModelChange({
                  presencePenalty: parseFloat(e.target.value) || undefined,
                })
              }
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
