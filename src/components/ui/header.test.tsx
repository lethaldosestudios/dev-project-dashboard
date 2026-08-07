import React from 'react';
import { render } from '@testing-library/react';
import { Header } from './header';

test('Header renders and matches snapshot', () => {
  const { asFragment, getByText } = render(
    <Header
      title="Test Title"
      subtitle="A subtitle"
      actions={<button>Action</button>}
    />
  );

  expect(getByText('Test Title')).toBeInTheDocument();
  expect(asFragment()).toMatchSnapshot();
});
