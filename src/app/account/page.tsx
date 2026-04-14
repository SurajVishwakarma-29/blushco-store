import { auth } from "@clerk/nextjs/server";

import { AccountDetailsForm } from "@/components/account/AccountDetailsForm";

export default async function AccountPage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return (
    <div className="container mx-auto px-6 md:px-12 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
          My Account
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Add your age and shipping details to unlock personalized recommendations and enable checkout.
        </p>
      </div>

      <AccountDetailsForm />
    </div>
  );
}