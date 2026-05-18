import { AppHeader } from "@/components/layout/app-header";
import { ChatbotWrapper } from "@/components/loomstory/chatbot-wrapper";
import { GlobalNavigationOverlay } from "@/components/shared/global-navigation-overlay";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <ChatbotWrapper />
      <GlobalNavigationOverlay />
    </div>
  );
}
