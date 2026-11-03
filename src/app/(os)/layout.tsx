import { Composer } from "@/components/budget/composer";
import { OSProvider } from "@/components/shell/os-provider";
import { MobileBar, MobileDock, Sidebar } from "@/components/shell/sidebar";
import { ToastProvider } from "@/components/ui/toast";

export default function OSLayout({ children }: LayoutProps<"/">) {
  return (
    <ToastProvider>
      <OSProvider>
        <div className="flex min-h-dvh">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <MobileBar />
            <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-32 pt-6 md:px-10 md:pt-10 lg:pb-16">{children}</main>
          </div>
        </div>
        <MobileDock />
        <Composer />
      </OSProvider>
    </ToastProvider>
  );
}
