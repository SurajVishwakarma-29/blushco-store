import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 gap-4">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/account"
        oauthFlow="popup"
      />
      <p className="text-xs uppercase tracking-widest text-muted-foreground text-center max-w-xl">
        Use email plus password or Google sign-in. After signup, complete age and address in My Account.
      </p>
    </div>
  );
}
