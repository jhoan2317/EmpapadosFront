import React from 'react';
import { Pagination, Group } from '@mantine/core';

const PaginationComponent = ({ count, currentPage, pageSize, onPageChange }) => {
    const totalPages = Math.ceil(count / pageSize);

    if (totalPages <= 1) return null;

    return (
        <Group justify="center" mt="xl">
            <Pagination
                total={totalPages}
                value={currentPage}
                onChange={onPageChange}
                color="yellow"
                withEdges
            />
        </Group>
    );
};

export default PaginationComponent;
