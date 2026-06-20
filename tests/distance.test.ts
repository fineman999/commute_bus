import assert from 'node:assert/strict'
import test from 'node:test'
import { findNearest, haversineKm } from '../src/lib/distance.ts'
import type { BusRoute } from '../src/types/route.ts'

test('haversineKm returns zero for identical coordinates', () => {
  assert.equal(haversineKm(37.3422, 127.9202, 37.3422, 127.9202), 0)
})

test('haversineKm calculates a known one-degree longitude distance near the equator', () => {
  const distance = haversineKm(0, 0, 0, 1)

  assert.ok(distance > 111)
  assert.ok(distance < 112)
})

test('findNearest ignores stops without coordinates and sorts by distance', () => {
  const sampleRoutes: BusRoute[] = [
    {
      id: 1,
      name: '제1노선',
      description: '테스트 노선',
      color: '#2563eb',
      stops: [
        { id: 'missing', name: '좌표 없는 정류장', dong: '무실동' },
        { id: 'far', name: '먼 정류장', dong: '단구동', lat: 37.5, lng: 128 },
      ],
    },
    {
      id: 2,
      name: '제2노선',
      description: '테스트 노선',
      color: '#059669',
      stops: [{ id: 'near', name: '가까운 정류장', dong: '반곡동', lat: 37.34, lng: 127.92 }],
    },
  ]

  const results = findNearest(37.3422, 127.9202, sampleRoutes, 2)

  assert.equal(results.length, 2)
  assert.equal(results[0].stop.id, 'near')
  assert.equal(results[1].stop.id, 'far')
})
