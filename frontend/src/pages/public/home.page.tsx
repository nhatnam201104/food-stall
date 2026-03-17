import { HomeHero } from '../../components/public/home.hero';
import { HomeFeatures } from '../../components/public/home.features';
import { HomeTestimonials } from '../../components/public/home.testimonials';

const HomePage = () => {
    return (
        <div>
            <HomeHero />
            <HomeFeatures />
            <HomeTestimonials />
        </div>
    );
};

export default HomePage;