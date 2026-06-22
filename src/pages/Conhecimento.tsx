import { useSearchParams } from "react-router-dom";
import { BookOpen, GraduationCap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConhecimentoView } from "@/components/ConhecimentoView";
import { AulasView } from "@/components/AulasView";
import { useLearningContent } from "@/hooks/useLearningContent";

export default function Conhecimento() {
  const { items, loading } = useLearningContent("corretor");
  const [params, setParams] = useSearchParams();
  const initialTab = params.get("tab") === "aulas" ? "aulas" : "artigos";

  const onChange = (value: string) => {
    const next = new URLSearchParams(params);
    if (value === "aulas") next.set("tab", "aulas");
    else next.delete("tab");
    setParams(next, { replace: true });
  };

  return (
    <div className="px-4 pt-6 pb-24">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Conhecimento</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Hub unificado de conteúdo técnico e capacitação.
        </p>
      </header>

      <Tabs defaultValue={initialTab} onValueChange={onChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-11">
          <TabsTrigger value="artigos" className="gap-1.5 text-xs font-semibold">
            <BookOpen className="h-4 w-4" />
            Artigos Técnicos
          </TabsTrigger>
          <TabsTrigger value="aulas" className="gap-1.5 text-xs font-semibold">
            <GraduationCap className="h-4 w-4" />
            Aulas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="artigos" className="mt-4">
          <ConhecimentoView items={items} loading={loading} audience="corretor" />
        </TabsContent>

        <TabsContent value="aulas" className="mt-4">
          <AulasView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
