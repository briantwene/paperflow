import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "../ui/card";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saveSettings, useSettingsStore } from "@/lib/store";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../ui/select";
import { open } from "@tauri-apps/plugin-dialog";
import { useTheme } from "@/hooks/useTheme";
import { Theme } from "../theme-provider";

const formSchema = z.object({
  path: z.string(),
  theme: z.string()
});

const GeneralSettingsTab = () => {
  const { path, theme } = useSettingsStore((state) => ({
    path: state.path,
    theme: state.theme
  }));

  const { setTheme } = useTheme();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      path: path,
      theme: theme
    }
  });

  const formValues = form.watch();
  // TODO: Remove this
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    saveSettings({
      ...values,
      providerUsernames: {},
      providerSources: {}
    });
    // save the values in the state
  };

  const selectPath = async () => {
    const selectedPath = await open({
      directory: true,
      multiple: false,
      defaultPath: path
    });

    if (selectedPath) {
      form.setValue("path", selectedPath as string);
    }
  };
  useEffect(() => {
    //TODO: could do a check to see if the theme is the same
    setTheme(formValues?.theme as Theme);

    saveSettings({
      ...formValues,
      providerUsernames: {},
      providerSources: {}
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValues.theme, formValues.path]);

  return (
    <Card className="flex-1 w-full md:w-1/2">
      <CardHeader>
        <CardTitle>General</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="path"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Download Path</FormLabel>
                  <FormControl>
                    <Input disabled={true} placeholder="shadcn" {...field} />
                  </FormControl>
                  <Button onClick={selectPath}>Change</Button>

                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Theme</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            ></FormField>
          </form>
        </Form>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
};

export default GeneralSettingsTab;
