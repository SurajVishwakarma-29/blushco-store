import { SignIn  } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
        oauthFlow="popup"
      />
    </div>
  );
}
