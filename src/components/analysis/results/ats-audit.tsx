import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ATS_FACTOR_META, type AnalysisResult } from "@/lib/analysis/schema";
import { BulletList, Chip, Gauge, ScoreBar } from "./primitives";

export function AtsAudit({ result }: { result: AnalysisResult }) {
  const ats = result.ats;
  return (
    <Card className="print-block">
      <CardHeader>
        <CardTitle className="text-base">ATS compatibility audit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-[auto_1fr]">
          <div className="flex justify-center">
            <Gauge value={ats.total} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {ATS_FACTOR_META.map((meta) => (
              <ScoreBar key={meta.key} label={meta.label} value={ats.factors[meta.key]} max={meta.max} />
            ))}
          </div>
        </div>

        <Tabs defaultValue="recommendations">
          <TabsList className="flex-wrap">
            <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
            <TabsTrigger value="keywords">Keywords & Skills</TabsTrigger>
            <TabsTrigger value="format">Format & Sections</TabsTrigger>
            <TabsTrigger value="content">Content & Verbs</TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="pt-4">
            <BulletList items={ats.recommendations} empty="No ATS fixes needed." />
          </TabsContent>

          <TabsContent value="keywords" className="space-y-4 pt-4">
            <div>
              <p className="mb-2 text-sm font-medium">Matched keywords</p>
              <div className="flex flex-wrap gap-2">
                {ats.keywords.matched.length ? (
                  ats.keywords.matched.map((k) => (
                    <Chip key={k} tone="green">
                      {k}
                    </Chip>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">None detected.</p>
                )}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Missing keywords</p>
              <div className="flex flex-wrap gap-2">
                {ats.keywords.missing.length ? (
                  ats.keywords.missing.map((k) => (
                    <Chip key={k} tone="red">
                      {k}
                    </Chip>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nothing missing.</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="format" className="grid gap-6 pt-4 sm:grid-cols-3">
            <div>
              <p className="mb-2 text-sm font-medium">Sections present</p>
              <div className="flex flex-wrap gap-2">
                {ats.format.sections_present.map((s) => (
                  <Chip key={s} tone="green">
                    {s}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Sections missing</p>
              <div className="flex flex-wrap gap-2">
                {ats.format.sections_missing.map((s) => (
                  <Chip key={s} tone="red">
                    {s}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Formatting issues</p>
              <BulletList items={ats.format.issues} empty="No formatting risks found." />
            </div>
          </TabsContent>

          <TabsContent value="content" className="grid gap-6 pt-4 sm:grid-cols-3">
            <div>
              <p className="mb-2 text-sm font-medium">Strong action verbs</p>
              <div className="flex flex-wrap gap-2">
                {ats.content.strong_verbs.map((v) => (
                  <Chip key={v} tone="green">
                    {v}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Weak phrasing</p>
              <div className="flex flex-wrap gap-2">
                {ats.content.weak_phrases.map((v) => (
                  <Chip key={v} tone="yellow">
                    {v}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Suggestions</p>
              <BulletList items={ats.content.suggestions} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
