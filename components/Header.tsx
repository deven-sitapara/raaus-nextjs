import Image from "next/image";

export default function Header() {
  return (
    <header className="bg-white w-full shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <Image
          src="/raa-logo.svg"
          alt="RAAus Logo"
          width={200}
          height={40}
          priority
          className="h-auto"
        />
      </div>
    </header>
  );
}
