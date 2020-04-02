const should = require('should');
const sinon = require('sinon');
const express = require('express');
const SessionService = require('../');

describe('SessionService', function () {
    it('Returns the user for the id stored on the session', async function () {
        const getSession = async (req) => {
            if (req.session) {
                return req.session;
            }
            req.session = {
                destroy: sinon.spy(cb => cb())
            };
            return req.session;
        };
        const findUserById = sinon.spy(async ({id}) => ({id}));
        const getOriginOfRequest = sinon.stub().returns('origin');

        const sessionService = SessionService({
            getSession,
            findUserById,
            getOriginOfRequest
        });

        const req = Object.create(express.request, {
            ip: {
                value: '0.0.0.0'
            },
            headers: {
                value: {
                    cookie: 'thing'
                }
            },
            get: {
                value: () => 'Fake'
            }
        });
        const res = Object.create(express.response);
        const user = {id: 'egg'};

        await sessionService.createSessionForUser(req, res, user);

        should.equal(req.session.user_id, 'egg');

        const actualUser = await sessionService.getUserForSession(req, res);
        should.ok(findUserById.calledWith(sinon.match({id: 'egg'})));

        const expectedUser = await findUserById.returnValues[0];
        should.equal(actualUser, expectedUser);

        await sessionService.destroyCurrentSession(req, res);
        should.ok(req.session.destroy.calledOnce);
    });
});

