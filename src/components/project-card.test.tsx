import React from 'react';
import { render } from '@testing-library/react';
import { ProjectCard } from './project-card';

const sampleProject = {
  id: '1',
  slug: 'sample',
  name: 'Sample Project',
  last_activity_at: new Date().toISOString(),
  priority: 'normal',
  status: 'active',
  description: 'A test project',
  stack: 'Next.js',
};

test('ProjectCard renders and matches snapshot', () => {
  const { asFragment, getByText } = render(<ProjectCard project={sampleProject as any} activityCount={3} />);
  expect(getByText('Sample Project')).toBeInTheDocument();
  expect(asFragment()).toMatchSnapshot();
});
