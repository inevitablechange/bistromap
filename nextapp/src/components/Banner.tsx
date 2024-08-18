import Link from "next/link";
import Image from "next/image";

interface BannerProps {
  image: string;
  link?: string;
}

const Banner: React.FC<BannerProps> = ({ image, link }) => {
  return (
    <Link href={link || "#"} passHref>
      <Image
        src={image}
        alt="Banner"
        layout="responsive"
        width={900}
        height={400}
      />
    </Link>
  );
};

export default Banner;
