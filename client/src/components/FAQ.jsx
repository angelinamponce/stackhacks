import { useState, useEffect } from 'react';
import { FAQ_Tabs } from './FAQ_Tabs';
import { client } from '../sanityClient';
import LoadError from './LoadError';

const FAQ = () => {
  const [categories, setCategories] = useState({});
  const [faqData, setFaqData] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const fetchFAQ = async () => {
      try {
        const query = `*[_type == "faq"] | order(category asc) {
          category,
          categoryLabel,
          questions
        }`;

        const data = await client.fetch(query);

        // Transform into the shape FAQ_Tabs expects
        const categoriesMap = {};
        const faqDataMap = {};

        data.forEach(item => {
          categoriesMap[item.category] = item.categoryLabel;
          faqDataMap[item.category] = item.questions;
        });

        setCategories(categoriesMap);
        setFaqData(faqDataMap);
      } catch (e) {
        console.error("Failed to fetch FAQ from Sanity: ", e);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQ();
  }, []);

  if (loadError) return <LoadError what="the FAQ" className="my-6" />;
  if (loading || Object.keys(categories).length === 0) return null;

  return (
    <FAQ_Tabs
      title="Frequently Asked Questions"
      subtitle="Learn more about stackhacks"
      categories={categories}
      faqData={faqData}
    />
  );
};

export default FAQ;