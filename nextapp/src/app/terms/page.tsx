import { Box, Heading } from "@chakra-ui/react";
import React from "react";

const Page = () => {
  return (
    <Box maxW="1024px" fontSize={"large"} marginY={10}>
      <Heading marginBottom={6}>Terms of Service</Heading>
      <Heading as="h3" size="lg" marginY={6}>
        1. Introduction{" "}
      </Heading>
      <p>
        Welcome to Bistro Map! These Terms of Service (the “Terms”) govern your
        use of our platform, including our website and mobile applications
        (collectively, the “Services”). By accessing or using our Services, you
        agree to comply with and be bound by these Terms. If you do not agree
        with these Terms, you may not use our Services.
      </p>
      <Heading as="h3" size="lg" marginY={6}>
        2. Service Overview
      </Heading>
      <p>
        Bistro Map utilizes blockchain technology to offer restaurant reviews,
        ratings, and related features. Users can log in via MetaMask wallet,
        explore restaurant details, submit reviews, and interact with other
        users on the platform.
      </p>
      <Heading as="h3" size="lg" marginY={6}>
        3. User Responsibilities
      </Heading>
      <p>
        Lawful Use: You must use our Services in a lawful and appropriate manner
        and must not post or share any illegal or inappropriate content.
        Respectful Interaction: You are responsible for ensuring that your
        actions on the platform do not harm or infringe upon other users.
        Compliance: You must adhere to these Terms and all applicable laws while
        using our Services.
      </p>
      <Heading as="h3" size="lg" marginY={6}>
        4. Content
      </Heading>
      <ol style={{ paddingInlineStart: 30 }}>
        <li>
          Ownership:All content on Bistro Map (including text, images, reviews,
          etc.) is owned by us. You may not reproduce, distribute, or modify any
          content without our prior written permission.
        </li>
        <li>
          User-Generated Content: You are responsible for ensuring that any
          content you post is accurate and does not infringe on the rights of
          others. We reserve the right to review, modify, or delete
          user-generated content as necessary.
        </li>
        <li>
          Content Review: We may monitor and moderate content to ensure
          compliance with our policies and legal requirements.
        </li>
      </ol>
      <Heading as="h3" size="lg" marginY={6}>
        5. Blockchain and Rewards System
      </Heading>
      <ol style={{ paddingInlineStart: 30 }}>
        <li>
          Rewards: Users may earn rewards for contributing reviews and engaging
          with the platform, distributed through blockchain technology.
        </li>
        <li>
          Distribution: Rewards and tokens are subject to the platform’s
          policies and may change without prior notice.{" "}
        </li>
        <li>
          Responsibility: You are solely responsible for managing and utilizing
          any rewards or tokens earned on the platform.
        </li>
      </ol>
      <Heading as="h3" size="lg" marginY={6}>
        6. Privacy
      </Heading>
      <ol style={{ paddingInlineStart: 30 }}>
        <li>
          Data Protection: We are committed to protecting your personal data.
          Our privacy practices are detailed in our separate Privacy Policy,
          which you consent to by using our Services.
        </li>
        <li>
          Disclosure: We may disclose personal information when required by law
          or to protect our rights, and we will notify you accordingly.
        </li>
      </ol>
      <Heading as="h3" size="lg" marginY={6}>
        7. Service Limitations and Termination
      </Heading>
      <ol style={{ paddingInlineStart: 30 }}>
        <li>
          Access Restrictions: We reserve the right to limit or terminate your
          access to our Services for violations of these Terms or for illegal
          activities.
        </li>
        <li>
          Account Termination: You may disconnect from the platform through your
          MetaMask wallet at any time. Upon disconnection, we may not retain or
          delete any data or content associated with your account.
        </li>
      </ol>
      <Heading as="h3" size="lg" marginY={6}>
        8. Disclaimer of Warranties
      </Heading>
      <ol style={{ paddingInlineStart: 30 }}>
        <li>
          No Liability: We are not liable for any damages resulting from the use
          of our Services.
        </li>
        <li>
          Service Quality: We do not guarantee that the Services will be
          uninterrupted, error-free, or entirely accurate.
        </li>
      </ol>
      <Heading as="h3" size="lg" marginY={6}>
        9. Changes to Terms
      </Heading>
      <ol style={{ paddingInlineStart: 30 }}>
        <li>
          Modifications: We may update these Terms from time to time. Any
          changes will be effective when posted on the platform.
        </li>
        <li>
          Review: You are responsible for reviewing the updated Terms and
          deciding whether to continue using our Services.
        </li>
      </ol>
      <Heading as="h3" size="lg" marginY={6}>
        10. Governing Law and Disputes
      </Heading>
      <ol style={{ paddingInlineStart: 30 }}>
        <li> Legal Compliance: These Terms are governed by applicable laws.</li>
        <li>
          Dispute Resolution: Any disputes arising from these Terms will be
          resolved in the courts located in the jurisdiction of the platform’s
          headquarters.
        </li>
      </ol>
      <Heading as="h3" size="lg" marginY={6}>
        11. Contact Information
      </Heading>
      <ol style={{ paddingInlineStart: 30 }}>
        <li>Email: support@bistromap.com</li>
        <li>
          Address: Gyeomjaero 18gil 32, Jungnang-gu, Seoul City, Republic of
          Korea
        </li>
      </ol>
    </Box>
  );
};

export default Page;
