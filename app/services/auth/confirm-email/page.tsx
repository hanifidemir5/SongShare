export default function ConfirmEmailPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      <h1 className="text-2xl font-bold">Almost There!</h1>
      <p className="text-center">
        We have sent a confirmation email to your inbox. Please check your email
        and click the link to activate your account.
      </p>
      <a
        href="https://mail.google.com"
        target="_blank"
        className="mt-4 btn bg-blue-600 text-white"
      >
        Open Email
      </a>
    </div>
  );
}
